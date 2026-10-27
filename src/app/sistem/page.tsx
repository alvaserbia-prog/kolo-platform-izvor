import { getServerSession } from "next-auth";
import { javnaRangListaNovca } from "@/lib/protokol/pokrovitelj";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nivoZaKumulativ } from "@/lib/protokol/donacija";
import { dohvatiSaldoFondacije } from "@/lib/protokol/fondacija";
import { BEZ_DECE } from "@/lib/protokol/deca";
import { dnevniPregledPrograma, labelPrograma } from "@/lib/protokol/programi";
import { uslovZapisaProtokola, opisZapisaProtokola, VEZA_PROGRAMA } from "@/lib/protokol/program-prikaz";
import { USLOV_AKTIVNO_DETE } from "@/lib/protokol/skole";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { dnevniLimit } from "@/lib/programi-iznosi-pravila";
import { USLOV_CLANA_U_SPISKU } from "@/lib/clanovi-spisak";
import { zadrugeZaPrikaz } from "@/lib/protokol/zadruga";
import SistemKlijent from "./SistemKlijent";
import { prikazStatusa } from "@/lib/status-prikaz";
import { USLOVI_STATUSA } from "@/lib/admin-clanovi";
import { usloviVidljivostiOglasa } from "@/lib/protokol/deca";
import { pokroviteljiZaMapu } from "@/lib/protokol/upis-pokrovitelja";

/** Živ nalog (CLAUDE.md pravilo 19; `docs/merenje-stanja.md`). */
const ZIV_NALOG = { oauthPending: false, deaktiviranAt: null, status: "ACTIVE" } as const;
/**
 * Razmena se broji samo kad su OBE strane živi nalozi — isti uslov kao naslovna
 * (`src/app/page.tsx`), da dve stranice sa istom brojkom ne mere dva skupa
 * (pregled ekipe, 24.10.2026). Ide uz `USLOV_RAZMENE` u broj, „danas", zbir i spisak.
 */
const ZIVE_STRANE = {
  fromWallet: { user: USLOV_CLANA_U_SPISKU },
  toWallet: { user: USLOV_CLANA_U_SPISKU },
};
import { SEKCIJE, type Sekcija } from "./sekcije";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sistem");
  return pageMetadata({ title: `${t("naslov_stranice")} — KOLO`, description: t("meta_opis"), path: "/sistem" });
}

export default async function SistemPage({
  searchParams,
}: {
  searchParams: Promise<{ sekcija?: string }>;
}) {
  // Stranica je javna (odluka vlasnika, 24.10.2026). Gost vidi kartice i zbirove;
  // spiskove (zapisi, razmene, donacije, učesnici) server za njega NE čita —
  // Politika privatnosti čl. 11 st. 4: neprijavljenom samo agregat.
  const session = await getServerSession(authOptions);
  const gost = !session;

  // Sekcija iz URL-a (?sekcija=clanovi) — back navigacija vraća na istu sekciju.
  const { sekcija } = await searchParams;
  const pocetnaSekcija: Sekcija = (SEKCIJE as readonly string[]).includes(sekcija ?? "")
    ? (sekcija as Sekcija)
    : "pregled";

  const verified = !!session?.user.verified;

  const danas = new Date();
  danas.setHours(0, 0, 0, 0);

  const [
    protokol,
    ukupnoKorisnika,
    verifikovanih,
    emisije,
    protokolZapisi,
    razmeneZapisi,
    ukupnoTransakcija,
    korisnici,
    danasKorisnika,
    danasTransakcija,
    ukupnoDonacijaRaw,
    danasDonacijaRaw,
    ukupanIznosTxRaw,
    danasIznosTxRaw,
    donacijeLista,
    pokroviteljiLista,
    ukupnoVerifikacija,
    danasVerifikacija,
    saldoFondacije,
    aktivneDece,
    korisnika,
    prikaz,
    mesta,
  ] = await Promise.all([
    prisma.wallet.findUnique({
      where: { id: "banka-singleton" },
      select: { balance: true },
    }),
    prisma.user.count({ where: { oauthPending: false, deaktiviranAt: null, status: "ACTIVE" } }),
    // U Kolu (verifikovani: član bez potvrde, član Kola, čuvar, osnivač) — samo
    // živi punoletni nalozi (CLAUDE.md pravilo 19). 🔴 Dete se ne broji ovde: dete
    // nikad nije ni korisnik ni verifikovan, ono ide u svoj broj (`aktivneDece`).
    prisma.user.count({
      where: { AND: [USLOVI_STATUSA.verifikovan, ZIV_NALOG] },
    }),
    prisma.dailyEmissionSummary.findMany({
      orderBy: { date: "desc" },
      take: 30,
    }),
    // Dve odvojene liste, jer dve kartice pokazuju dve različite stvari i svaka
    // mora da ima svojih sto redova. Dok je bio jedan mešan upit od 100 najnovijih,
    // razmene su se gubile među zapisima Protokola (emisija je mnogo više), pa je
    // ispod kartice „Ukupno razmena" znao da stoji šačica redova iako ih je u
    // sistemu mnogo više.
    // „Ukupno POENA" (opticaj) → zapisi Protokola: sve što NIJE prenos između
    // korisnika. Tu spada i poništenje prepisa: ono se dešava između dva
    // korisnička zapisa, ali je akt Fondacije, ne razmena.
    gost ? Promise.resolve([]) : prisma.transaction.findMany({
      where: {
        // 🔴 Zapis socijalnog programa ulazi u spisak samo verifikovanom
        // posmatraču (Pravilnik o programima podrške čl. 20 st. 1–2),
        // i uslov za to stoji na JEDNOM mestu — `uslovZapisaProtokola`. Isti
        // uslov koriste `/api/pocetna/liste` i `/api/javno/feed`; prepisan ovde,
        // razišao bi se pri prvoj sledećoj izmeni. Osnov po kome je pravo
        // ostvareno se ne prikazuje nikome (programi čl. 20 st. 3) i upit ga ne dovlači.
        // Operativni doprinos je na sopstvenom tipu `EMISIJA_OPERATIVNI`.
        ...uslovZapisaProtokola(verified),
        // 🔴 Deca izlaze iz spiska, kao i u `/api/javno/feed`. Ovaj upit tu
        // proveru nije imao, pa je pseudonim deteta izlazio uz emisije iz dečjeg
        // prostora — dok isti podatak feed izričito krije (Politika čl. 11 st. 5 t. 1).
        // Zapis Protokola i zapis Kruga nemaju korisnika i moraju da prođu.
        AND: [
          { OR: [{ fromWalletId: null }, { fromWallet: { is: BEZ_DECE } }] },
          { toWallet: { is: BEZ_DECE } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        ...VEZA_PROGRAMA,
        fromWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
        toWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
      },
    }),
    // „Ukupno razmena" → isključivo prepisi između korisnika (TRANSFER), i to
    // oni od najmanje `MIN_POEN_RAZMENE`. Spisak ide kroz isti uslov kao brojač
    // iznad njega — inače bi ispod kartice stajali redovi koje kartica ne broji.
    gost ? Promise.resolve([]) : prisma.transaction.findMany({
      where: {
        ...USLOV_RAZMENE,
        ...ZIVE_STRANE,
        AND: [
          { OR: [{ fromWalletId: null }, { fromWallet: { is: BEZ_DECE } }] },
          { toWallet: { is: BEZ_DECE } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        fromWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
        toWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
      },
    }),
    // Kartica „Ukupno razmena" broji samo prenose između korisnika (TRANSFER),
    // ne i evidentiranje Protokola (EMISIJA_*, UPIS/OTPIS_ZRNO), i ne prepise
    // ispod praga iz `razmena-brojac-pravila.ts`.
    prisma.transaction.count({ where: { ...USLOV_RAZMENE, ...ZIVE_STRANE } }),
    // 🔴 Spisak učesnika (pseudonim, stanje, donacije) čita se SAMO za verifikovanog
    // posmatrača (Pravilnik čl. 56). Korisniku van Kola i detetu ide samo ono što
    // traži zbir po mestu — kao gostu na `/zadruge` — jer vidljivost sprovodi
    // server, ne ekran (ekran je i ranije krio spisak, ali je podatak stizao do
    // pregledača). Brana: `sistem-vidljivost-izvor.test.ts`.
    !verified
      ? Promise.resolve([])
      : prisma.user.findMany({
      // Sakrij nezavršene OAuth naloge (privremeni pseudonim „korisnik_…",
      // oauthPending=true) i deaktivirane/neaktivne naloge iz spiska članova.
      where: USLOV_CLANA_U_SPISKU,
      orderBy: [{ wallet: { balance: "desc" } }],
      select: {
        id: true,
        pseudonim: true,
        verified: true,
        avatar: true,
        location: true,
        createdAt: true,
        maloletan: true,
        wallet: { select: { balance: true } },
        krugClanstva: {
          where: { leftAt: null },
          select: { krug: { select: { name: true } } },
          take: 1,
        },
        donations: {
          where: { status: "CONFIRMED" },
          select: { amountRSD: true },
        },
      },
    }),
    prisma.user.count({
      where: { createdAt: { gte: danas } },
    }),
    prisma.transaction.count({
      where: { ...USLOV_RAZMENE, ...ZIVE_STRANE, createdAt: { gte: danas } },
    }),
    prisma.donationRecord.count({ where: { status: "CONFIRMED" } }),
    prisma.donationRecord.count({
      where: { status: "CONFIRMED", confirmedAt: { gte: danas } },
    }),
    // Kartica „Razmenjeno POENA" (odluka vlasnika, 24.10.2026) broji ISTI skup kao
    // kartica „Razmene" pored nje — `USLOV_RAZMENE` — pa zbir podeljen brojem daje
    // prosečnu razmenu. Vraćanja Protokolu i prepisi ispod praga ne ulaze; ranija
    // „Ukupno prepisa" brojala je svaki `TRANSFER`, i vraćanja pri gašenju naloga.
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...USLOV_RAZMENE, ...ZIVE_STRANE },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...USLOV_RAZMENE, ...ZIVE_STRANE, createdAt: { gte: danas } },
    }),
    // 🔴 Anonimna donacija ULAZI u spisak, ali bez pseudonima i bez linka
    // (R-03, mera M-3c). Do ovog seta je uslov bio samo `status: CONFIRMED` —
    // polje `javno` se nije gledalo uopšte, pa se donator koji je izabrao
    // anonimnost prikazivao SA PSEUDONIMOM, iznosom i datumom, svakom redovnom
    // članu. Pseudonim vodi na profil, a kolona POEN mu je stajala na 0 (anonimna
    // donacija ne nosi POEN) — jedini takav red u tabeli, dakle i oznaka „ovaj je
    // donirao anonimno". Donacije čl. 11 i Uslovi čl. 16 obećavaju suprotno.
    // Lista donacija (set 4.8.2; donacije čl. 11 st. 1; Uslovi čl. 16 st. 3, 5):
    // ime i prezime donatora javne donacije, iznos i datum — isto korisniku i
    // verifikovanom. 🔴 Pseudonim i veza ka profilu se ne čitaju (ne stižu ni do
    // klijenta). Anonimna donacija ulazi samo iznosom. Isti uslov kao `/api/donacije`.
    gost || session.user.maloletan
      ? Promise.resolve([])
      : prisma.donationRecord.findMany({
          where: {
            status: "CONFIRMED",
            OR: [
              { javno: false },
              { javno: true, donatorIme: { not: null } },
              { javno: true, imePovucenoAt: { not: null } },
            ],
          },
          orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
          take: 50,
          select: {
            // 🔴 Bez `poenEmitted` i `level`: RSD i POEN u istom redu daju odnos
            // deljenjem (R-01; odluka vlasnika 25.10.2026).
            id: true, amountRSD: true, donatorIme: true,
            javno: true, confirmedAt: true, createdAt: true,
          },
        }),
    // Ista rang-lista kao `/pokrovitelji` (donacije čl. 25): naziv i logotip iz upisa, bez
    // adrese; obrisan upis ostaje, osim na zahtev (donacije čl. 18 st. 4).
    javnaRangListaNovca(),
    prisma.verifikacionaVeza.count(),
    prisma.verifikacionaVeza.count({
      where: { vremenskiZig: { gte: danas } },
    }),
    dohvatiSaldoFondacije(),
    // Maloletni nalozi u stanju AKTIVNO (bar jedan roditelj je redovan član).
    // Oni su punopravni korisnici — koriste dečji prostor, sklapaju prijateljstva
    // i primaju POEN — pa ulaze u broj članova na kartici, iako u lanac potvrda
    // ne smeju da uđu (Pravilnik o učešću dece čl. 29 st. 2), tj. `verified` im je
    // trajno `false`. Uslov je isti onaj po kome se broji ranglista škola —
    // jedna istina o tome šta je aktivno dete.
    prisma.user.count({ where: { ...USLOV_AKTIVNO_DETE, oauthPending: false } }),
    // Korisnici (set 4.8.2): punoletni živi nalozi koji još nisu u Kolu. Broje se
    // zasebno, a ne kao razlika od ukupnog — razlika bi u „korisnike" uvukla decu
    // na čekanju i decu sa roditeljem.
    prisma.user.count({
      where: { AND: [USLOVI_STATUSA.korisnik, ZIV_NALOG] },
    }),
    session ? prikazStatusa(session.user.id) : Promise.resolve(null),
    verified
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: USLOV_CLANA_U_SPISKU,
          select: { verified: true, maloletan: true, location: true },
        }),
  ]);

  // Pokazatelji zajednice (raspored kartica od 24.10.2026). Broji se samo živo
  // (pravilo 19, `docs/merenje-stanja.md`); dete se ne broji među korisnike.
  const odNedelje = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const odMeseca = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const PUNOLETAN_ZIV = { ...ZIV_NALOG, maloletan: false };
  const [
    aktivni7, aktivni30, cuvara, osnivaca, oglasiPoTipu, vauceraPreuzeto, vauceraIskorisceno,
    gazdinstava, clanovaGazdinstava, firmi, pokroviteljiNaMapi, skoleSaDecom,
  ] = await Promise.all([
    prisma.aktivnostLog.findMany({
      where: { createdAt: { gte: odNedelje }, user: PUNOLETAN_ZIV },
      distinct: ["userId"], select: { userId: true },
    }),
    prisma.aktivnostLog.findMany({
      where: { createdAt: { gte: odMeseca }, user: PUNOLETAN_ZIV },
      distinct: ["userId"], select: { userId: true },
    }),
    // Čuvari Kola: čuvari i osnivači (osnivači su početni čuvari Kola).
    prisma.user.count({ where: { AND: [USLOVI_STATUSA.cuvar, ZIV_NALOG] } }),
    prisma.user.count({ where: { AND: [USLOVI_STATUSA.osnivac, ZIV_NALOG] } }),
    // Isti uslov kao naslovna (`src/app/page.tsx`).
    prisma.marketplaceListing.groupBy({
      by: ["tip"],
      where: { status: "ACTIVE", seller: usloviVidljivostiOglasa(null) },
      _count: { _all: true },
    }),
    // Vaučeri: samo komadi, nikad dinari (R-01).
    prisma.vaucer.count({ where: { status: { in: ["DODELJEN", "ISKORISCEN"] } } }),
    prisma.vaucer.count({ where: { status: "ISKORISCEN" } }),
    prisma.gazdinstvo.count({ where: { status: "ODOBRENO", obrisanoAt: null } }),
    prisma.clanGazdinstva.count({
      where: { status: "ODOBREN", gazdinstvo: { status: "ODOBRENO", obrisanoAt: null } },
    }),
    prisma.upisPokrovitelja.count({ where: { status: "ODOBREN", obrisanAt: null, vrsta: "FIRMA" } }),
    // „sa vaučerima" — isti spisak kao stranica `/firme`.
    pokroviteljiZaMapu(),
    prisma.user.findMany({
      where: { ...USLOV_AKTIVNO_DETE, oauthPending: false, skolaSifra: { not: null } },
      distinct: ["skolaSifra"], select: { skolaSifra: true },
    }),
  ]);
  const oglasa = (tip: "PONUDA" | "POTRAZNJA") =>
    oglasiPoTipu.find((g) => g.tip === tip)?._count._all ?? 0;
  const pokazatelji = {
    aktivni7: aktivni7.length,
    aktivni30: aktivni30.length,
    cuvara: cuvara + osnivaca,
    ponuda: oglasa("PONUDA"),
    potraznja: oglasa("POTRAZNJA"),
    vauceraPreuzeto,
    vauceraIskorisceno,
    gazdinstava,
    clanovaGazdinstava,
    firmi,
    firmiSaVaucerima: pokroviteljiNaMapi.filter((p) => p.vrsta === "FIRMA" && p.vauceri > 0).length,
    skola: skoleSaDecom.length,
  };

  const opticaj = Math.abs(protokol?.balance ?? 0);
  const protokolBalance = protokol?.balance ?? 0;

  const ukupnoDonacija = ukupnoDonacijaRaw;
  const danasDonacija = danasDonacijaRaw;
  const ukupanIznosTx = ukupanIznosTxRaw._sum.amount ?? 0;
  const danasIznosTx = danasIznosTxRaw._sum.amount ?? 0;
  const donacije = donacijeLista.map((d) => ({
    id: d.id,
    // Anonimna donacija: iznos ulazi u zbir, lice ne izlazi nigde. Povučeno ime
    // (donacije čl. 12) ostavlja donaciju u listi bez imena.
    ime: d.javno ? d.donatorIme : null,
    anonimno: !d.javno,
    amountRSD: Number(d.amountRSD),
    confirmedAt: (d.confirmedAt ?? d.createdAt).toISOString(),
  }));

  const pokrovitelji = pokroviteljiLista.map((p) => ({
    id: p.id,
    naziv: p.naziv,
    logoUrl: p.logoUrl,
    rsdKumulativ: p.rsdKumulativ,
    trenutniNivo: p.trenutniNivo,
  }));

  const danasEmisija = emisije[0];
  const danasEmitovano = danasEmisija?.totalEmitted ?? 0;
  const danasLimit = danasEmisija?.limit ?? dnevniLimit(opticaj);

  const locale = await getLocale();
  // Union, jer isti mapper služi oba spiska: zapisi Protokola nose vezu do prijave
  // na program, prepisi (`TRANSFER`) je po prirodi ne mogu imati.
  // 🔴 Strane zapisa (pseudonim i id) dobija samo verifikovan posmatrač; korisniku
  // van Kola i detetu idu `null` — iznos i vreme bez strana (Pravilnik čl. 56), isto
  // kao `/api/pocetna/liste`. Protokol nije osoba i njegovo ime ostaje.
  const strana = (w: { user: { id: string; pseudonim: string } | null } | null) =>
    !w?.user
      ? { pseudonim: "Protokol" as string | null, id: null as string | null }
      : verified
        ? { pseudonim: w.user.pseudonim as string | null, id: w.user.id as string | null }
        : { pseudonim: null, id: null };
  const zaPrikaz = (t: (typeof protokolZapisi)[number] | (typeof razmeneZapisi)[number]) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    // 🔴 Naziv socijalnog programa se sklapa PRI ČITANJU, iz prijave, i samo za
    // verifikovanog posmatrača — u zapisu i dalje stoji opšta oznaka.
    description: opisZapisaProtokola(locale, t, verified),
    createdAt: t.createdAt.toISOString(),
    fromPseudonim: strana(t.fromWallet).pseudonim,
    fromId: strana(t.fromWallet).id,
    toPseudonim: strana(t.toWallet).pseudonim,
    toId: strana(t.toWallet).id,
  });

  const protokolTx = protokolZapisi.map(zaPrikaz);
  const razmene = razmeneZapisi.map(zaPrikaz);

  // Bez spiska (korisnik van Kola, dete): samo mesto i potvrđenost, a
  // identifikator je redni broj, ne id naloga — kao gost na `/zadruge`.
  const anonimni = mesta.map((u, i) => ({
    id: String(i), pseudonim: "", verified: u.verified, maloletan: u.maloletan,
    avatar: null, balance: 0, krug: null, rangDonacije: 0,
    location: u.location ?? null, createdAt: "",
  }));
  const clanovi = verified ? korisnici.map((u) => {
    const donacijeRSD = u.donations.reduce((s, d) => s + Number(d.amountRSD), 0);
    return {
      id: u.id,
      pseudonim: u.pseudonim,
      verified: u.verified,
      maloletan: u.maloletan,
      avatar: u.avatar,
      balance: u.wallet?.balance ?? 0,
      krug: u.krugClanstva[0]?.krug?.name ?? null,
      // 🔴 Samo nivo, bez dinarskog zbira: pseudonim + RSD uz stanje POEN-a
      // (odluka vlasnika 25.10.2026). Zbir ne napušta server.
      rangDonacije: donacijeRSD > 0 ? nivoZaKumulativ(donacijeRSD).nivo : 0,
      location: u.location ?? null,
      createdAt: u.createdAt.toISOString(),
    };
  }) : anonimni;

  // Socijalni programi: dnevni zbir po programu stoji UMESTO pojedinačnih redova,
  // koji su merom M-1 (R-03) izašli iz spiska zapisa Protokola. Proverljivost
  // ostaje potpuna — zbir agregata plus ostali kanali daju promenu opticaja.
  const programiPregled = await dnevniPregledPrograma(14);
  const zadruge = await zadrugeZaPrikaz();

  const emisijeChart = emisije
    .slice(0, 14)
    .reverse()
    .map((e) => ({
      date: e.date.toISOString().split("T")[0],
      emitted: e.totalEmitted,
      limit: e.limit,
    }));

  return (
    <SistemKlijent
      pseudonim={session?.user.pseudonim ?? ""}
      gost={gost}
      verified={verified}
      opticaj={opticaj}
      protokolBalance={protokolBalance}
      ukupnoKorisnika={ukupnoKorisnika}
      verifikovanih={verifikovanih}
      aktivneDece={aktivneDece}
      korisnika={korisnika}
      status={prikaz?.status ?? null}
      zrno={prikaz?.zrno ?? null}
      ukupnoTransakcija={ukupnoTransakcija}
      danasEmitovano={danasEmitovano}
      danasLimit={danasLimit}
      danasKorisnika={danasKorisnika}
      danasTransakcija={danasTransakcija}
      ukupnoVerifikacija={ukupnoVerifikacija}
      danasVerifikacija={danasVerifikacija}
      racunFondacije={saldoFondacije.saldo}
      ukupnoDonacija={ukupnoDonacija}
      danasDonacija={danasDonacija}
      ukupanIznosTx={ukupanIznosTx}
      danasIznosTx={danasIznosTx}
      donacije={donacije}
      pokrovitelji={pokrovitelji}
      emisijeChart={emisijeChart}
      programiPregled={programiPregled.map((r) => ({ ...r, label: labelPrograma(r.program) }))}
      protokolTx={protokolTx}
      razmene={razmene}
      clanovi={clanovi}
      zadruge={zadruge}
      pokazatelji={pokazatelji}
      pocetnaSekcija={pocetnaSekcija}
    />
  );
}
