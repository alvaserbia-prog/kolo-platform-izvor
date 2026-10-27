import type { Metadata } from "next";
/**
 * /verifikacija — stranica Potvrde (dokaz stvarnosti, set 4.8.2; spec §4.4).
 *
 * Tri pogleda, po statusu iz jezgra (`prikazStatusa` → `ucitajStatus`):
 *  - KORISNIK — kartica statusa, „Moj kod" (pokaži ga nekome ko te lično zna) i
 *    „Želim da me neko nazove" sa osnovima (dokaz čl. 8);
 *  - ČLAN BEZ POTVRDE — kartica sa obaveznim rečenicama (crta ih `OznakaStatusa`),
 *    „Moj kod" (da ga potvrdi član Kola), „Želim da me neko nazove radi potvrde"
 *    (čl. 16; set 4.8.3), „Uvedi u Kolo" (čl. 4 st. 2), „Koga si uveo" i lanac;
 *  - ČLAN KOLA, ČUVAR KOLA, OSNIVAČ — spisak povezanih (`#povezani`, čl. 17),
 *    „Potvrdi", spisak „Žele da ih neko nazove" (`#zahtevi`; zahteve radi potvrde
 *    vide samo čuvari), zahtevi za potvrdu postojanja deteta (`#postojanje-deteta`),
 *    lanac sa oznakom vrste po čvoru, oznake i prijava pogrešne verifikacije.
 *
 * Raspored (odluke vlasnika 21.09. i 20.10.2026): LEVO status, „Moj kod",
 * potvrđivanje i ispod njih zabeležene potvrde; DESNO lanac potvrda. Na telefonu se
 * kolone slažu jedna ispod druge tim redom.
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { jePotvrdjen, jeVerifikovan, potvrdjenIzPolja } from "@/lib/status-ucesnika-pravila";
import { prikazStatusa } from "@/lib/status-prikaz";
import { jeAdmin } from "@/lib/dozvole";
import { brojVerifikacijaDanas } from "@/lib/protokol/verifikacija-service";
import { mojZahtev, osnoviZaSpisak, uslovRazgovoraRadiPotvrde } from "@/lib/protokol/zahtev-razgovor";
import IndeksPrikaz from "@/components/verifikacija/IndeksPrikaz";
import { dohvatiZabelezenePotvrde } from "@/lib/protokol/potvrda-poen";
import SpisakCekanja from "@/components/SpisakCekanja";
import SpisakZaPoziv from "@/components/verifikacija/SpisakZaPoziv";
import ZelimDaMeNekoNazove, { type UslovPrikaz } from "@/components/verifikacija/ZelimDaMeNekoNazove";
import SpisakPovezanih from "@/components/verifikacija/SpisakPovezanih";
import ZahteviPostojanjaDeteta from "@/components/verifikacija/ZahteviPostojanjaDeteta";
import { POEN_VERIFIKATOR } from "@/lib/protokol/dokaz-stvarnosti";
import { PotvrdaPoenStatus } from "@/generated/prisma/client";
import MiniStablo, {
  type CvorVerifikator,
  type CvorVerifikovani,
} from "@/components/verifikacija/MiniStablo";
import MojQrKod from "@/components/verifikacija/MojQrKod";
import VerifikujNekoga from "@/components/verifikacija/VerifikujNekoga";
import MojeOznake, { type VerifikovanaOsoba } from "@/components/verifikacija/MojeOznake";
import PrijaviVerifikaciju from "@/components/verifikacija/PrijaviVerifikaciju";
import NaslovStranice from "@/components/ui/NaslovStranice";
import { klaseDugmeta } from "@/components/ui/Dugme";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("verifikacija");
  return { title: t("page_naslov") };
}

const POLJA_POTVRDJENOSTI = {
  maloletan: true,
  jeOsnivac: true,
  verified: true,
  indeksStvarnosti: true,
  potvrdjenAt: true,
} as const;

export default async function VerifikacijaPage() {
  const t = await getTranslations("verifikacija");
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = session.user.id;

  const prikaz = await prikazStatusa(userId);
  if (!prikaz) redirect("/login");
  const { status } = prikaz;
  // 🔴 Podaci o nadzoru ne prikazuju se ni verifikatoru ni verifikovanom (Politika
  // čl. 15 st. 7) — samo administratorskom timu, isto kao u ruti lanca potvrda.
  const admin = jeAdmin(session.user);

  // 🔴 Dete ne ulazi u lanac potvrda ni kao meta (Pravilnik o učešću dece čl. 29 st. 2):
  // nikoga ne potvrđuje i njega niko ne potvrđuje. Njegovo mesto u mreži su
  // prijatelji, pa se sa ove stranice šalje tamo.
  if (status.startsWith("DETE_")) redirect("/prijatelji");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pseudonim: true,
      jeOsnivac: true,
      verifikacijeKojeSuMeVerifikovale: {
        orderBy: { vremenskiZig: "asc" },
        select: {
          vrsta: true,
          verifikator: { select: { id: true, pseudonim: true } },
        },
      },
      verifikacijeKojeSamObavio: {
        orderBy: { vremenskiZig: "asc" },
        select: {
          id: true,
          vrsta: true,
          oznakaVerifikatora: true,
          podlezeNadzoru: true,
          nadzornikId: true,
          // Da li je POEN po toj verifikaciji upisan (dokaz stvarnosti čl. 19).
          poenStatus: true,
          verifikovani: { select: { id: true, pseudonim: true, ...POLJA_POTVRDJENOSTI } },
        },
      },
    },
  });
  if (!user) redirect("/login");

  const korisnik = status === "KORISNIK";
  const bezPotvrde = status === "CLAN_BEZ_POTVRDE";
  const potvrdjen = jePotvrdjen(status);
  // Verifikuje svaki verifikovan učesnik: član bez potvrde UVODI (čl. 4 st. 2),
  // član Kola, čuvar i osnivač POTVRĐUJU. Kočnica je dnevni tempo (čl. 21), a broj
  // današnjih verifikacija ide formi, koja sama pokazuje upozorenje.
  const mozeDaVerifikuje = jeVerifikovan(status);
  const potvrdaDanas = mozeDaVerifikuje ? await brojVerifikacijaDanas(userId) : 0;
  // „Moj kod" služi onome ko verifikaciju još može da primi: korisnik (od bilo kog
  // verifikovanog) i član bez potvrde (samo potvrdu člana Kola). Osnivač nikad.
  const mozePrimiti = korisnik || bezPotvrde;

  const verifikatorCvorovi: CvorVerifikator[] = user.verifikacijeKojeSuMeVerifikovale.map((v) => ({
    id: v.verifikator.id,
    pseudonim: v.verifikator.pseudonim,
    vrsta: v.vrsta,
    potvrdjen,
  }));

  const verifikovaniCvorovi: CvorVerifikovani[] = user.verifikacijeKojeSamObavio.map((v) => ({
    id: v.verifikovani.id,
    pseudonim: v.verifikovani.pseudonim,
    statusNadzora: !admin || !v.podlezeNadzoru ? "ne-podleze" : v.nadzornikId ? "nadzirano" : "ceka-nadzor",
    vrsta: v.vrsta,
    potvrdjen: potvrdjenIzPolja(v.verifikovani),
  }));

  // 🔴 Zabeležene potvrde idu NA VRH spiska — da se vidi koga treba podsetiti.
  const mojeOznake: VerifikovanaOsoba[] = user.verifikacijeKojeSamObavio
    .map((v) => ({
      verifikacijaId: v.id,
      korisnikId: v.verifikovani.id,
      pseudonim: v.verifikovani.pseudonim,
      oznaka: v.oznakaVerifikatora,
      cekaDoprinos: v.poenStatus === PotvrdaPoenStatus.ZABELEZEN,
      vrsta: v.vrsta,
      potvrdjen: potvrdjenIzPolja(v.verifikovani),
      statusNadzora: (!admin || !v.podlezeNadzoru ? "ne-podleze" : v.nadzornikId ? "nadzirano" : "ceka-nadzor") as VerifikovanaOsoba["statusNadzora"],
    }))
    .sort((a, b) => Number(b.cekaDoprinos) - Number(a.cekaDoprinos));

  const podnaslov = korisnik
    ? t("podnaslov_korisnik")
    : bezPotvrde
      ? t("podnaslov_bez_potvrde")
      : t("potvrde_danas", { broj: potvrdaDanas });

  // POEN po potvrdi čeka trag stvarnog učešća (dokaz stvarnosti čl. 19). Red stoji i
  // onome ko je potvrdu dobio i onome ko ju je dao — on čeka TUĐI potez.
  const zabelezenePotvrde = await dohvatiZabelezenePotvrde(userId);
  const cekaMoje = zabelezenePotvrde.kaoPotvrdjeni;
  const cekaDate = await prisma.verifikacionaVeza.findMany({
    where: { verifikatorId: userId, poenStatus: PotvrdaPoenStatus.ZABELEZEN },
    select: { id: true, verifikovani: { select: { id: true, pseudonim: true } } },
    orderBy: { vremenskiZig: "desc" },
  });
  const cekaDateLjudi = cekaDate.map((v) => ({
    id: v.verifikovani.id,
    pseudonim: v.verifikovani.pseudonim,
  }));

  // „Želim da me neko nazove" — korisnik (dokaz čl. 8; tabela dozvola br. 12) i,
  // radi potvrde, član bez potvrde (čl. 16; br. 12a).
  const [osnovi, moj] = korisnik
    ? await Promise.all([osnoviZaSpisak(userId), mojZahtev(userId)])
    : bezPotvrde
      ? [[], await mojZahtev(userId)]
      : [[], null];
  let uslovRazgovora: UslovPrikaz | undefined;
  if (bezPotvrde) {
    const u = await uslovRazgovoraRadiPotvrde(userId);
    uslovRazgovora = u.ok ? { ok: true } : { ok: false, uslov: u.uslov, odDana: u.odDana?.toISOString() ?? null };
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <NaslovStranice naslov={t("page_naslov")} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <IndeksPrikaz
            status={status}
            podnaslov={podnaslov}
            svoj
            naStaSeCeka={prikaz.naStaSeCeka}
            zrno={prikaz.zrno}
          />

          {mozePrimiti && (
            <div id="moj-kod">
              <MojQrKod zaClanaBezPotvrde={bezPotvrde} />
            </div>
          )}

          {korisnik && <ZelimDaMeNekoNazove osnovi={osnovi} mojZahtev={moj} />}
          {bezPotvrde && (
            <ZelimDaMeNekoNazove osnovi={[]} mojZahtev={moj} radiPotvrde uslov={uslovRazgovora} />
          )}

          {/* „Čeka na tebe" ide pre obrasca (odluka vlasnika, 24.10.2026): tuđi zahtevi
              koji čekaju — spisak za poziv (crveni krug kad rok prođe, dokaz čl. 8
              i 11), zahtevi za potvrdu postojanja deteta (deca čl. 13)
              i spisak povezanih (dokaz čl. 17). Samo član Kola, čuvar Kola i osnivač. Sidra
              `#zahtevi`, `#postojanje-deteta` i `#povezani` nose same komponente. */}
          {potvrdjen && <SpisakZaPoziv />}
          {potvrdjen && <ZahteviPostojanjaDeteta />}
          {potvrdjen && <SpisakPovezanih />}

          {mozeDaVerifikuje && (
            <VerifikujNekoga
              mozeDaVerifikuje={mozeDaVerifikuje}
              potvrdaDanas={potvrdaDanas}
              rezim={bezPotvrde ? "UVODJENJE" : "POTVRDA"}
            />
          )}

          {/* Zabeležene potvrde stoje LEVO, ispod koda i potvrđivanja, a pored lanca
              potvrda (odluka vlasnika, 20.10.2026). */}
          {(cekaMoje > 0 || cekaDate.length > 0) && (
            <div id="zabelezene" className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
              <h2 className="text-sm font-semibold text-kolo-text">{t("ceka_naslov")}</h2>
              {cekaMoje > 0 && (
                <p className="mt-2 text-sm text-kolo-text">
                  {t("ceka_moja", { iznos: cekaMoje.toLocaleString("sr-RS") })}
                </p>
              )}
              {cekaDate.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-kolo-text">
                    {t("ceka_dao_zbir", {
                      iznos: (cekaDate.length * POEN_VERIFIKATOR).toLocaleString("sr-RS"),
                    })}
                  </p>
                  <SpisakCekanja ljudi={cekaDateLjudi} />
                </div>
              )}
              <p className="mt-2 text-sm text-kolo-muted">{t("ceka_opis")}</p>
              {/* 🔴 Klase `kolo-dugme-primarno`/`-sekundarno` NE POSTOJE — dugme ide
                  kroz `klaseDugmeta()` iz dizajn sistema. */}
              {/* Samo „Objavi ponudu" (odluka vlasnika, 24.10.2026): dugme „Doniraj"
                  pored „čeka te 1.000 POENA" čitalo se kao „uplati pa dobij POEN" —
                  POEN se ne kupuje, a donacija nije njegova cena. */}
              {cekaMoje > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="/pijaca/novi-oglas"
                    className={klaseDugmeta()}
                  >
                    {t("ceka_dugme_oglas")}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <MiniStablo
            className="flex-1"
            ja={{ pseudonim: user.pseudonim }}
            verifikatori={verifikatorCvorovi}
            verifikovani={verifikovaniCvorovi}
            // Koga je potvrdio stoji jednom — u spisku sa oznakama ispod.
            verifikovaniIspod={mozeDaVerifikuje}
            jeJaPocetni={user.jeOsnivac}
            prikaziNadzor={admin}
          />
        </div>
      </div>

      {/* Član bez potvrde: „Koga si uveo" (kad njega neko potvrdi, oni mu dolaze na
          spisak povezanih — čl. 17). Član Kola, čuvar, osnivač: oznake. */}
      {mozeDaVerifikuje && <MojeOznake osobe={mojeOznake} rezim={bezPotvrde ? "UVODJENJE" : "POTVRDA"} />}

      {/* Diskretna prijava pogrešne/neželjene verifikacije (hrani nadzor integriteta). */}
      {mozeDaVerifikuje && verifikatorCvorovi.length > 0 && <PrijaviVerifikaciju />}
    </div>
  );
}
