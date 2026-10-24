import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sesija } from "@/lib/sesija";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { ucitajUcesnika, usloviVidljivostiOglasa } from "@/lib/protokol/deca";
import {
  brojOglasaUzPrijavu,
  MIN_OGLASA_UZ_PRIJAVU,
  adresaZaMapu,
  pravaUGazdinstvu,
  posledicaIzlaska,
  trebaIzvod,
  pristupanjeSmeOdobriti,
} from "@/lib/protokol/gazdinstvo";
import { ucitajStatus } from "@/lib/protokol/status";
import { kategorijaEmoji } from "@/lib/kategorije";
import MapaJavna from "../MapaJavna";
import UpravljanjeGazdinstvom from "./UpravljanjeGazdinstvom";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Obavestenje from "@/components/ui/Obavestenje";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const g = await prisma.gazdinstvo.findUnique({ where: { id }, select: { naziv: true, naselje: true, status: true } });
  if (!g || g.status !== "ODOBRENO") return { title: "KOLO" };
  return { title: `${g.naziv} · ${g.naselje} — KOLO` };
}

/**
 * Profil gazdinstva (Pravilnik o gazdinstvima čl. 6 i 11).
 *
 * Odobreno gazdinstvo je javno: naziv, naselje, opis, tačka na mapi, oglasi u ime
 * gazdinstva i pseudonimi članova. Adresa se ispisuje uz tačku SAMO kad je data
 * izjava iz čl. 4 t. 3 (`adresaZaMapu`). 🔴 BPG se ne prikazuje nikome ovde.
 * Gazdinstvo koje nije odobreno vide samo njegovi članovi, pozvani i admin.
 *
 * Radnje člana se izvode iz statusa (set 4.8.2, `pravaUGazdinstvu`): upravlja
 * član Kola i podnosilac koji radi bez članova (čl. 9, 9a), poziva član Kola kad
 * gazdinstvo prima članove (čl. 4a, 7), a izjavu, izmenu podataka, izvod i
 * brisanje vodi lice koje odgovara za izjavu (čl. 9 st. 2, 11 st. 5).
 */
export default async function GazdinstvoPage({ params }: Props) {
  const { id } = await params;
  const session = await sesija();
  if (session?.user.maloletan) redirect("/pocetna");
  const t = await getTranslations("gazdinstva");

  const g = await prisma.gazdinstvo.findUnique({
    where: { id },
    select: {
      id: true,
      naziv: true,
      naselje: true,
      opis: true,
      lat: true,
      lng: true,
      adresa: true,
      izjavaAdresaAt: true,
      status: true,
      razlogVracanja: true,
      upravljaId: true,
      neregistrovano: true,
      izvodRpg: { select: { id: true } },
      clanovi: {
        where: { status: { in: ["POZVAN", "PRISTUPIO", "ODOBREN"] } },
        orderBy: { pristupioAt: "asc" },
        select: { id: true, userId: true, status: true, uloga: true, user: { select: { pseudonim: true } } },
      },
    },
  });
  if (!g) notFound();

  const moje = session ? g.clanovi.find((c) => c.userId === session.user.id) ?? null : null;
  const admin = jeAdmin(session?.user);
  const odobreno = g.status === "ODOBRENO";
  if (!odobreno && !moje && !admin) notFound();

  const posmatrac = session ? await ucitajUcesnika(session.user.id) : null;
  const oglasi = await prisma.marketplaceListing.findMany({
    where: {
      gazdinstvoId: g.id,
      status: "ACTIVE",
      tip: "PONUDA",
      uklonjenAt: null,
      seller: {
        AND: [
          usloviVidljivostiOglasa(posmatrac),
          // Pre odobrenja oglas stoji u ime gazdinstva i kad je oglašivač tek
          // pristupio; posle odobrenja oznaku nosi samo odobren član (čl. 10).
          { clanstvaGazdinstva: { some: { gazdinstvoId: g.id, status: { in: odobreno ? ["ODOBREN"] : ["PRISTUPIO", "ODOBREN"] } } } },
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, category: true, location: true, seller: { select: { pseudonim: true } } },
  });

  const javniClanovi = g.clanovi.filter((c) => c.status === (odobreno ? "ODOBREN" : "PRISTUPIO") || c.status === "ODOBREN");
  const jeClan = moje?.status === "PRISTUPIO" || moje?.status === "ODOBREN";
  const brojValidnih = jeClan || admin ? await brojOglasaUzPrijavu(g.id) : 0;
  // Samo da li ime postoji — samo ime se ovde ne čita (evidencija identiteta, čl. 31a).
  const imaIme = moje
    ? (await prisma.identitetNaloga.count({ where: { userId: moje.userId } })) > 0
    : false;

  // Prava i obaveze člana (set 4.8.2) — sve se izvodi na serveru.
  const prava = jeClan && session ? await pravaUGazdinstvu(session.user.id, g.id) : null;
  const mojStatusUcesnika = moje && session ? await ucitajStatus(session.user.id) : null;
  const upit =
    prava && moje
      ? await prisma.upitIzjaveGazdinstva.findFirst({
          where: { clanId: moje.id, status: "CEKA" },
          select: { id: true, rokDo: true },
        })
      : null;
  const posledica = jeClan && session ? await posledicaIzlaska(session.user.id, g.id) : null;

  return (
    <div className="max-w-[900px] mx-auto pb-16 space-y-6">
      <NaslovStranice
        nazad={{ href: "/gazdinstva", oznaka: t("nazad") }}
        naslov={g.naziv || t("bez_naziva")}
        opis={
          <>
            {g.naselje}
            {odobreno && adresaZaMapu(g.adresa, g.izjavaAdresaAt) && `, ${adresaZaMapu(g.adresa, g.izjavaAdresaAt)}`}
            {!odobreno && ` · ${t(`status_${g.status}`)}`}
          </>
        }
      />

      {g.status === "VRACENO" && g.razlogVracanja && jeClan && (
        <Obavestenje vrsta="upozorenje">
          {t("vraceno_razlog", { razlog: g.razlogVracanja })}
        </Obavestenje>
      )}

      {g.opis && <p className="whitespace-pre-line text-sm text-kolo-text">{g.opis}</p>}

      {g.lat !== null && g.lng !== null && (
        <MapaJavna tacke={[{ id: g.id, naziv: g.naziv, naselje: g.naselje, lat: g.lat, lng: g.lng }]} visina={300} />
      )}

      <section>
        <h2 className="text-sm font-semibold text-kolo-green-900 mb-2">{t("clanovi")}</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {javniClanovi.map((c) => (
            <li key={c.id} className="rounded-full border border-kolo-border bg-kolo-surface px-3 py-1">
              {c.user.pseudonim}
              {c.uloga === "NOSILAC" && <span className="text-kolo-muted"> · {t("uloga_nosilac")}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-kolo-green-900 mb-2">{t("ponuda")}</h2>
        {oglasi.length === 0 ? (
          <p className="text-sm text-kolo-muted">{t("nema_oglasa")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {oglasi.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/pijaca/${o.id}`}
                  className="flex items-center gap-3 rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-3 hover:border-kolo-green-500 transition-colors"
                >
                  <span className="text-2xl">{kategorijaEmoji(o.category)}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-sm text-kolo-text truncate">{o.title}</span>
                    <span className="block text-xs text-kolo-muted">
                      {o.seller.pseudonim}
                      {o.location ? ` · ${o.location}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-kolo-muted">{t("domace_napomena")}</p>
      </section>

      {session && moje && (
        <UpravljanjeGazdinstvom
          gazdinstvoId={g.id}
          status={g.status}
          mojStatus={moje.status}
          mojaUloga={moje.uloga}
          odgovaram={g.upravljaId === session.user.id}
          upravlja={prava?.upravlja ?? false}
          poziva={prava?.poziva ?? false}
          smeClanove={prava?.smeClanove ?? false}
          uKolu={mojStatusUcesnika ? pristupanjeSmeOdobriti(mojStatusUcesnika) : false}
          trebaIzvod={!!prava?.jePodnosilac && !!mojStatusUcesnika && trebaIzvod(mojStatusUcesnika, !g.neregistrovano)}
          imaIzvod={!!g.izvodRpg}
          upit={upit ? { id: upit.id, rokDo: upit.rokDo.toISOString() } : null}
          posledica={posledica}
          opis={g.opis}
          imaNosioca={g.clanovi.some((c) => c.uloga === "NOSILAC" && c.status !== "POZVAN")}
          registrovano={!g.neregistrovano}
          brojOglasa={brojValidnih}
          minOglasa={MIN_OGLASA_UZ_PRIJAVU}
          clanId={moje.id}
          pozvani={g.clanovi.filter((c) => c.status === "POZVAN").map((c) => c.user.pseudonim)}
          naCekanju={g.clanovi.filter((c) => odobreno && c.status === "PRISTUPIO").map((c) => c.user.pseudonim)}
          imaIme={imaIme}
          imaIzjavuAdrese={!!g.izjavaAdresaAt}
        />
      )}
    </div>
  );
}
