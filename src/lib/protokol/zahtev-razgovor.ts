/**
 * Spisak za poziv — „Želim da me neko nazove" (Pravilnik o dokazu stvarnosti čl. 4a;
 * Uslovi korišćenja čl. 16b; Registar radnji obrade br. 24; set 4.8.2). Ime fajla,
 * tabela `ZahtevZaRazgovor`, ruta `/api/zahtev-razgovor` i stranica
 * `/kontaktiraj-nas` ostaju (CLAUDE.md pravilo 12).
 *
 * Korisnik koji ne poznaje nijednog člana Kola dolazi na spisak po jednom od četiri
 * osnova (čl. 4a st. 2): sam zatraži razgovor (mesto, čime se bavi, kada je
 * dostupan), javna donacija od praga, novčano pokroviteljstvo, prijava gazdinstva
 * iz RPG kojom je nosilac. Za osnove van zahteva Fondacija mu samo NUDI spisak
 * (`ponudiSpisak`); broj telefona i pristanak ostavlja sam.
 *
 * Spisak vide samo članovi Kola (član bez potvrde ne vidi). Ime i prezime iz
 * evidencije identiteta, kad je upisano, i broj telefona otvaraju se klikom —
 * „Otvori ime i broj" — samo članu Kola koji je poziv otvorio i samo dok je
 * otvoren (`BROJ_OTVOREN_MINUTA`). Poziv je u isto vreme otvoren kod jednog člana
 * Kola, a jedan član Kola drži jedan otvoren poziv. Član Kola posle razgovora
 * korisnika UVODI u Kolo (dokaz čl. 5 st. 7, 5a) — to radi `verifikacija-service.ts`
 * uz `jeOtvorioPoziv`.
 *
 * 🔴 Fondacija BELEŽI koji je član Kola podatke otvorio (čl. 4a st. 5; Uslovi čl.
 * 16b st. 3): `ZapisOtvaranjaPoziva` se upisuje u ISTOJ transakciji sa otvaranjem.
 * Zapis vidi samo administratorski tim, kroz Platformu se ne izvozi i briše se
 * gašenjem naloga pozvanog. `otvorioId`/`otvorenDo` na zahtevu nose samo TEKUĆE
 * otvaranje i brišu se zatvaranjem ili istekom; zapis otvaranja ostaje.
 *
 * 🔴 Ime i broj ne idu u obaveštenje, opis, audit log ni mejl — samo u odgovor na
 * otvaranje. Brana `spisak-za-poziv-izvor.test.ts`, `zahtev-razgovor-izvor.test.ts`.
 *
 * 🔴 Dospeće na spisak ne potvrđuje stvarnost; od njega ne zavise donacija,
 * pokroviteljstvo, gazdinstvo ni doprinos po njima (čl. 4a st. 6).
 *
 * Zahtev radi potvrde (set 4.8.3; čl. 4a, 5c; osnov `POTVRDA`): član bez potvrde koji
 * je u Kolu najmanje 30 dana, bez usvojene prijave razmene ili oglasa i bez nadzornog
 * predmeta završenog utvrđenjem lažne verifikacije, traži razgovor sa čuvarom Kola.
 * Taj red vide i otvaraju SAMO čuvari Kola (`smeVidetiRed`). Upisnik ZRNA je prvi na
 * spisku, a Fondacija obezbeđuje poziv u roku od tri dana (`rokPozivaUpisnika`).
 */
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DonationStatus,
  GazdinstvoStatus,
  Prisma,
  UlogaUGazdinstvu,
  UserStatus,
} from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { razresiNaselje } from "@/lib/naselje";
import { istoIme, procitajImePrezime, PORUKA_DRUGO_IME } from "@/lib/identitet-pravila";
import { upisiIdentitet } from "./identitet";
import { oznakeZaNalog } from "./visestruki-nalog";
import { ucitajStatus, PRAG_VERIFIKACIJE } from "@/lib/protokol/status";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import {
  proveriUsloveRazgovora,
  redosledSpiska,
  rokPoziva,
  rokPozivaUpisnika,
  type ProveraRazgovora,
} from "@/lib/potvrda-clana-pravila";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import {
  brojZakljucan,
  otvorenDoOd,
  proveriZahtev,
  type UnosZahteva,
} from "@/lib/nov-clan-pravila";
import {
  PRAG_POTVRDE_UPLATOM_RSD,
  jeOsnovSpiska,
  smeNaSpisak,
  smeNaSpisakRadiPotvrde,
  smeVidetiRed,
  type OsnovSpiska,
} from "@/lib/spisak-za-poziv-pravila";

export * from "@/lib/nov-clan-pravila";
export * from "@/lib/spisak-za-poziv-pravila";

type Klijent = Prisma.TransactionClient | typeof prisma;

export class ZahtevGreska extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/**
 * Tekst obaveštenja i pristanka koji se snima uz upis na spisak (ne generiše se
 * ponovo pri čitanju — CLAUDE.md pravilo 11). Imenuje ko zove, šta vidi, da se
 * beleži ko je podatke otvorio i kada se šta briše (čl. 4a st. 4–5; Uslovi čl. 16b
 * st. 2, 3 i 6).
 */
export const PRISTANAK_ZAHTEVA =
  "Saglasan sam da budem na spisku za poziv. Pozvaće me član Kola koji će videti moje " +
  "ime i prezime i broj telefona, samo dok je poziv otvoren kod njega, i da li isti broj " +
  "ili isto ime i prezime stoje uz drugi nalog, uz mesto tog naloga. Spisak vide samo " +
  "članovi Kola. Fondacija beleži koji je član Kola moje podatke otvorio; taj zapis vidi " +
  "samo administratorski tim, čuva se dok postoji moj nalog i dajem ga na zahtev upućen " +
  "na privatnost@ekolo.rs. Ime i prezime, mesto i broj telefona ostaju uz moj nalog dok " +
  "on postoji i porede se sa drugim nalozima radi sprečavanja višestrukih naloga; mesto " +
  "i broj mogu da izmenim, ali ne i da obrišem. Podaci sa spiska (čime se bavim, kada sam " +
  "dostupan) brišu se kad budem uveden u Kolo ili potvrđen, kad povučem pristanak ili kad " +
  "mi prestane status učesnika. Dospeće na spisak ne potvrđuje stvarnost.";

/**
 * Tekst pristanka za zahtev radi potvrde (čl. 4a, 5c st. 3): zove čuvar Kola.
 */
export const PRISTANAK_ZAHTEVA_POTVRDA =
  "Saglasan sam da budem na spisku za poziv radi potvrde. Pozvaće me čuvar Kola koji će " +
  "videti moje ime i prezime i broj telefona, samo dok je poziv otvoren kod njega, i da li " +
  "isti broj ili isto ime i prezime stoje uz drugi nalog, uz mesto tog naloga. Moj zahtev " +
  "vide samo čuvari Kola. Fondacija beleži koji je čuvar Kola moje podatke otvorio; taj " +
  "zapis vidi samo administratorski tim, čuva se dok postoji moj nalog i dajem ga na " +
  "zahtev upućen na privatnost@ekolo.rs. Ime i prezime, mesto i broj telefona ostaju uz " +
  "moj nalog dok on postoji i porede se sa drugim nalozima radi sprečavanja višestrukih " +
  "naloga; mesto i broj mogu da izmenim, ali ne i da obrišem. Podaci sa spiska brišu se " +
  "kad budem potvrđen, kad povučem pristanak ili kad mi prestane status učesnika. " +
  "Razgovor sam po sebi nije potvrda.";

/**
 * Uslov „član Kola koji sme da vidi spisak i otvori poziv" (tabela dozvola
 * `VIDI_SPISAK_ZA_POZIV`): potvrđen (`potvrdjenAt`) ili osnivač, punoletan, aktivan.
 * 🔴 Član bez potvrde (verifikovan, bez `potvrdjenAt`) spisak ne vidi (čl. 4a st. 6).
 */
const POTVRDJEN_AKTIVAN = {
  maloletan: false,
  status: UserStatus.ACTIVE,
  deaktiviranAt: null,
  OR: [
    { jeOsnivac: true },
    { verified: true, indeksStvarnosti: { gte: PRAG_VERIFIKACIJE }, potvrdjenAt: { not: null } },
  ],
} satisfies Prisma.UserWhereInput;

/** Čuvar Kola: osnivač ili potvrđen nosilac ZRNA (`tipKorisnika` NOSILAC_ZRNA). */
const CUVAR_AKTIVAN = {
  maloletan: false,
  status: UserStatus.ACTIVE,
  deaktiviranAt: null,
  OR: [
    { jeOsnivac: true },
    {
      verified: true,
      indeksStvarnosti: { gte: PRAG_VERIFIKACIJE },
      potvrdjenAt: { not: null },
      tipKorisnika: "NOSILAC_ZRNA" as const,
    },
  ],
} satisfies Prisma.UserWhereInput;

/**
 * Uslovi iz čl. 5c st. 2 za člana bez potvrde: najmanje 30 dana od uvođenja, bez
 * usvojene prijave razmene (prepis poništen) ili prijave oglasa (oglas uklonjen), i
 * bez nadzornog predmeta protiv njega završenog utvrđenjem lažne verifikacije. Isto
 * proverava i potvrda telefonom (`verifikacija-service.ts`).
 */
export async function uslovRazgovoraRadiPotvrde(userId: string, db: Klijent = prisma): Promise<ProveraRazgovora> {
  const [uvodjenje, razmene, oglasi, predmeti] = await Promise.all([
    db.verifikacionaVeza.findFirst({
      where: { verifikovaniId: userId, vrsta: "UVODJENJE" },
      orderBy: { vremenskiZig: "asc" },
      select: { vremenskiZig: true },
    }),
    db.prijavaRazmene.count({ where: { protivId: userId, status: "PONISTENA" } }),
    db.prijavaOglasa.count({ where: { status: "RESENA", oglas: { sellerId: userId } } }),
    db.nadzorniPredmet.count({
      where: {
        status: "UTVRDJENA_LAZNA",
        OR: [
          { subjekt: { in: ["VERIFIKATOR", "OBA", "DEO_MREZE"] }, verifikacija: { verifikatorId: userId } },
          { subjekt: { in: ["VERIFIKOVANI", "OBA", "DEO_MREZE"] }, verifikacija: { verifikovaniId: userId } },
          { subjekt: { in: ["VERIFIKATOR", "OBA", "DEO_MREZE"] }, potvrdaClana: { potvrdioId: userId } },
          { subjekt: { in: ["VERIFIKOVANI", "OBA", "DEO_MREZE"] }, potvrdaClana: { potvrdjeniId: userId } },
        ],
      },
    }),
  ]);
  return proveriUsloveRazgovora({
    uvedenAt: uvodjenje?.vremenskiZig ?? null,
    usvojenihPrijava: razmene + oglasi,
    utvrdjenihLaznih: predmeti,
    sada: new Date(),
  });
}

/** Poruka za neispunjen uslov iz čl. 5c st. 2 (srpski original; ekran ide kroz ključeve). */
export function porukaUslovaRazgovora(p: ProveraRazgovora): string {
  if (p.ok) return "";
  if (p.uslov === "PRIJAVA")
    return "Razgovor radi potvrde nije moguć: protiv tebe je usvojena prijava razmene ili prijava oglasa.";
  if (p.uslov === "NADZOR")
    return "Razgovor radi potvrde nije moguć: u nadzornom predmetu protiv tebe utvrđeno je da je potvrda lažna.";
  return p.odDana
    ? `Razgovor radi potvrde moguć je posle 30 dana u Kolu, od ${p.odDana.toLocaleDateString("sr-RS")}.`
    : "Razgovor radi potvrde moguć je posle 30 dana u Kolu.";
}

/** Da li je član bez potvrde upisao ZRNO (prvo mesto na spisku, čl. 4a). */
export async function upisaoZrno(userId: string, db: Klijent = prisma): Promise<boolean> {
  const z = await db.zrnoStanje.findUnique({ where: { userId }, select: { slobodno: true, aktivno: true } });
  return !!z && z.slobodno + z.aktivno > 0;
}

/** Sopstveni upis na spisak (bez obzira na to da li je poziv trenutno otvoren). */
export async function mojZahtev(userId: string) {
  const z = await prisma.zahtevZaRazgovor.findUnique({
    where: { userId },
    select: { id: true, osnov: true, mesto: true, opis: true, dostupnost: true, telefon: true, createdAt: true },
  });
  return z ? { ...z, createdAt: z.createdAt.toISOString() } : null;
}

/**
 * Podaci za obrazac (set 4.8.4, N4-M2): upisano ime iz evidencije identiteta (ne
 * menja se — jedan nalog, jedno ime), mesto i broj sa profila.
 */
export async function podaciZaSpisak(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { location: true, telefon: true, identitet: { select: { imePrezime: true } }, podaci: { select: { punoIme: true } } },
  });
  return {
    imePrezime: u?.identitet?.imePrezime ?? u?.podaci?.punoIme ?? "",
    imeUpisano: !!u?.identitet,
    mesto: u?.location ?? "",
    telefon: u?.telefon ?? "",
  };
}

/**
 * Osnovi van zahteva po kojima korisnik SME na spisak (čl. 4a st. 2 t. 2–4).
 * Zahtev (t. 1) je uvek moguć i ne navodi se. Prazan niz za svakog ko nije korisnik.
 *
 *  - DONACIJA: javna, potvrđena, jedna uplata od praga, ime uplatioca iz izvoda se
 *    poklapa sa imenom uz donaciju, a uplatilac ne stoji uz drugi nalog (C-1);
 *  - POKROVITELJSTVO: novčana prijava koju je on podneo, čiji je prijem potvrđen;
 *  - GAZDINSTVO_RPG: on je nosilac u podnetoj prijavi gazdinstva, upisanog ili
 *    neupisanog u Registar (set 4.8.3; ime osnova ostaje).
 */
export async function osnoviZaSpisak(userId: string): Promise<OsnovSpiska[]> {
  const status = await ucitajStatus(userId);
  if (!status || !smeNaSpisak(status)) return [];

  const osnovi: OsnovSpiska[] = [];

  const donacije = await prisma.donationRecord.findMany({
    where: {
      userId,
      javno: true,
      status: DonationStatus.CONFIRMED,
      amountRSD: { gte: PRAG_POTVRDE_UPLATOM_RSD },
      uplatilac: { not: null },
    },
    select: { donatorIme: true, uplatilac: true, uplatilacKljuc: true },
  });
  for (const d of donacije) {
    if (!istoIme(d.donatorIme, d.uplatilac)) continue;
    const drugi = d.uplatilacKljuc
      ? await prisma.donationRecord.count({ where: { uplatilacKljuc: d.uplatilacKljuc, userId: { not: userId } } })
      : 0;
    if (drugi === 0) {
      osnovi.push("DONACIJA");
      break;
    }
  }

  const pokroviteljstvo = await prisma.pokroviteljPrijava.count({
    where: { podnosilacId: userId, vrstaDonacije: "NOVAC", status: "POTVRDJENA" },
  });
  if (pokroviteljstvo > 0) osnovi.push("POKROVITELJSTVO");

  const gazdinstvo = await prisma.clanGazdinstva.count({
    where: {
      userId,
      uloga: UlogaUGazdinstvu.NOSILAC,
      gazdinstvo: {
        podnetoAt: { not: null },
        status: { in: [GazdinstvoStatus.NA_PREGLEDU, GazdinstvoStatus.VRACENO, GazdinstvoStatus.ODOBRENO] },
      },
    },
  });
  if (gazdinstvo > 0) osnovi.push("GAZDINSTVO_RPG");

  return osnovi;
}

/**
 * Upis ili izmena na spisku. Upisuje se samo KORISNIK — punoletan, aktivan, koga
 * niko nije uveo u Kolo (član bez potvrde i član Kola se odbijaju, dete takođe).
 * Osnov van zahteva mora da postoji (`osnoviZaSpisak`). Prvi upis obaveštava SAMO
 * članove Kola (zvonce i push, bez imena, broja i mejla — radnja br. 24).
 */
export async function posaljiZahtev(userId: string, unos: Omit<UnosZahteva, "mesto"> & { mesto: unknown }) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { maloletan: true, status: true, deaktiviranAt: true, pseudonim: true, telefonZaPozivAt: true },
  });
  if (!u || u.deaktiviranAt || u.status !== UserStatus.ACTIVE) throw new ZahtevGreska("Nalog nije aktivan.", 403);
  if (u.maloletan) throw new ZahtevGreska("Maloletni učesnik ne dolazi na spisak za poziv.", 403);
  const status = await ucitajStatus(userId);
  const osnov: OsnovSpiska = unos.osnov === undefined ? "ZAHTEV" : unos.osnov;
  if (!jeOsnovSpiska(osnov)) throw new ZahtevGreska("Nepoznat osnov.", 400);

  if (osnov === "POTVRDA") {
    // Zahtev radi potvrde (čl. 5c st. 3) — samo član bez potvrde koji ispunjava uslove.
    if (!status || !smeNaSpisakRadiPotvrde(status))
      throw new ZahtevGreska("Razgovor radi potvrde traži član bez potvrde.", 409);
    const uslov = await uslovRazgovoraRadiPotvrde(userId);
    if (!uslov.ok) throw new ZahtevGreska(porukaUslovaRazgovora(uslov), 403);
  } else if (!status || !smeNaSpisak(status)) {
    throw new ZahtevGreska("Već si u Kolu — spisak za poziv je za one koje niko nije uveo.", 409);
  }
  if (osnov !== "ZAHTEV" && osnov !== "POTVRDA" && !(await osnoviZaSpisak(userId)).includes(osnov))
    throw new ZahtevGreska("Fondacija nije utvrdila osnov po kome bi došao na spisak. Pošalji zahtev za razgovor.", 403);

  const mesto = unos.mesto === null || unos.mesto === undefined || unos.mesto === "" ? null : razresiNaselje(unos.mesto);
  const provera = proveriZahtev({ ...unos, osnov, mesto });
  if (!provera.ok) throw new ZahtevGreska(provera.razlog, provera.status);
  const ime = procitajImePrezime(unos.imePrezime);
  if (!ime.ok) throw new ZahtevGreska(ime.razlog, 400);

  // Ime i prezime, mesto i broj ostaju uz nalog (set 4.8.4, N4-M2): ime u evidenciji
  // identiteta (Pravilnik čl. 31a, peti izvor), mesto i broj na profilu. Jedan nalog,
  // jedno ime — drugo ime ne prepisuje upisano. Porede se sa drugim nalozima
  // (`visestruki-nalog.ts`), a poređenje ništa ne blokira.
  const ishodImena = await upisiIdentitet(userId, ime.imePrezime, "SPISAK_ZA_POZIV");
  if (ishodImena === "RAZLIKUJE_SE") throw new ZahtevGreska(PORUKA_DRUGO_IME, 409);
  await prisma.user.update({
    where: { id: userId },
    data: { location: mesto, telefon: unos.telefon.trim(), telefonZaPozivAt: u.telefonZaPozivAt ?? new Date() },
  });

  const podaci = {
    osnov,
    mesto,
    opis: unos.opis.trim() || null,
    dostupnost: unos.dostupnost.trim() || null,
    telefon: unos.telefon.trim(),
    pristanakTekst: osnov === "POTVRDA" ? PRISTANAK_ZAHTEVA_POTVRDA : PRISTANAK_ZAHTEVA,
  };
  const postojao = await prisma.zahtevZaRazgovor.findUnique({ where: { userId }, select: { id: true } });
  await prisma.zahtevZaRazgovor.upsert({
    where: { userId },
    create: { userId, ...podaci },
    update: podaci,
  });

  if (!postojao) {
    const pseudonim = u.pseudonim;
    after(() => obavestiClanoveKola(userId, pseudonim, osnov));
  }
}

/** Korisnik povlači pristanak — upis na spisku se briše zajedno sa brojem. */
export async function povuciZahtev(userId: string) {
  await prisma.zahtevZaRazgovor.deleteMany({ where: { userId } });
}

/**
 * Uklanjanje sa spiska pri SVAKOJ verifikaciji korisnika — i uvođenju i potvrdi
 * (Uslovi čl. 16b st. 6). Potvrda člana bez potvrde ovo ne zove: on na spisku ni
 * ne može biti. Vraća da li je korisnik bio na spisku (ugovor sa
 * `verifikacija-service.ts`). Zapis otvaranja ostaje (čuva se dok postoji nalog
 * pozvanog). Ne baca na praznom spisku.
 */
export async function ukloniSaSpiskaPoVerifikaciji(
  userId: string,
  tx: Klijent = prisma,
): Promise<{ bioNaSpisku: boolean }> {
  const r = await tx.zahtevZaRazgovor.deleteMany({ where: { userId } });
  return { bioNaSpisku: r.count > 0 };
}

/**
 * Da li je verifikator ikad otvorio poziv ovog korisnika (`ZapisOtvaranjaPoziva`).
 * Ugovor sa `verifikacija-service.ts`: verifikacija posle otvorenog poziva je
 * uvođenje u Kolo (dokaz čl. 5a st. 1; otvoreno pitanje 1 specifikacije).
 */
export async function jeOtvorioPoziv(verifikatorId: string, pozvaniId: string, tx: Klijent = prisma): Promise<boolean> {
  const n = await tx.zapisOtvaranjaPoziva.count({ where: { otvorioId: verifikatorId, pozvaniId } });
  return n > 0;
}

/** Link na obrazac sa unapred izabranim osnovom (ruta ostaje — pravilo 12). */
export function linkSpiska(osnov: OsnovSpiska): string {
  return osnov === "ZAHTEV" ? "/kontaktiraj-nas" : `/kontaktiraj-nas?osnov=${osnov}`;
}

const PONUDA: Record<Exclude<OsnovSpiska, "ZAHTEV" | "POTVRDA">, string> = {
  DONACIJA: "Fondacija je utvrdila prijem tvoje donacije.",
  POKROVITELJSTVO: "Fondacija je utvrdila prijem pokroviteljstva po tvojoj prijavi.",
  GAZDINSTVO_RPG: "Podneo si prijavu gazdinstva kao nosilac.",
};

/**
 * Ponuda spiska posle donacije, pokroviteljstva ili prijave gazdinstva (čl. 4a st.
 * 2 t. 2–4): obaveštenje sa linkom na „Želim da me neko nazove". Korisnik na
 * spisak dolazi tek kad sam ostavi broj i pristanak. Šalje se samo korisniku koji
 * još nije na spisku.
 *
 * 🔴 Ne baca i ništa ne menja: donacija, pokroviteljstvo i gazdinstvo, i doprinos
 * po njima, od ovoga ne zavise (čl. 4a st. 6).
 */
export async function ponudiSpisak(userId: string, osnov: OsnovSpiska): Promise<void> {
  try {
    if (osnov === "ZAHTEV" || osnov === "POTVRDA") return;
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { maloletan: true, status: true, deaktiviranAt: true },
    });
    if (!u || u.maloletan || u.deaktiviranAt || u.status !== UserStatus.ACTIVE) return;
    const status = await ucitajStatus(userId);
    if (!status || !smeNaSpisak(status)) return;
    const vec = await prisma.zahtevZaRazgovor.findUnique({ where: { userId }, select: { id: true } });
    if (vec) return;
    await obavesti(userId, {
      tip: "spisak_ponuda",
      kljuc: `notifikacije.spisak_ponuda_${osnov.toLowerCase()}`,
      naslov: "Želiš li da te neko nazove?",
      tekst:
        `${PONUDA[osnov]} Ako ne poznaješ nijednog člana Kola, možeš na spisak za poziv: ` +
        "pozvaće te član Kola i posle razgovora može da te uvede u Kolo. Ostavljaš broj " +
        "telefona i pristanak; ništa od toga nije uslov za ono što si već uradio.",
      link: linkSpiska(osnov),
      email: false,
    });
  } catch (e) {
    console.error("[spisak-za-poziv] ponuda nije poslata", { userId, osnov, e });
  }
}

/**
 * Obaveštenje članovima Kola da je neko nov na spisku. Samo pseudonim — bez imena,
 * broja i mejla (zvonce i push; radnja br. 24). Zahtev radi potvrde ide samo čuvarima
 * Kola; Fondacija dobija upozorenje sa rokom poziva — tri dana za upisnika ZRNA, sedam za
 * sve ostale (čl. 4a).
 * Ne baca — upis je već sačuvan.
 */
async function obavestiClanoveKola(autorId: string, pseudonim: string, osnov: OsnovSpiska = "ZAHTEV") {
  try {
    const radiPotvrde = osnov === "POTVRDA";
    const primaoci = await prisma.user.findMany({
      where: { ...(radiPotvrde ? CUVAR_AKTIVAN : POTVRDJEN_AKTIVAN), id: { not: autorId } },
      select: { id: true },
    });
    for (const p of primaoci) {
      await obavesti(
        p.id,
        radiPotvrde
          ? {
              tip: "spisak_nov",
              kljuc: "notifikacije.spisak_nov_potvrda",
              parametri: { pseudonim },
              naslov: "Član bez potvrde traži razgovor",
              tekst: `„${pseudonim}" je član bez potvrde i traži razgovor radi potvrde sa čuvarom Kola.`,
              link: "/verifikacija#zahtevi",
              email: false,
            }
          : {
              tip: "spisak_nov",
              kljuc: "notifikacije.spisak_nov",
              parametri: { pseudonim },
              naslov: "Neko želi da ga neko nazove",
              tekst: `„${pseudonim}" ne poznaje nijednog člana Kola i želi da ga neko nazove. Možda ga poznaješ.`,
              link: "/verifikacija#zahtevi",
              email: false,
            },
      ).catch(() => {});
    }
    if (radiPotvrde && (await upisaoZrno(autorId))) {
      const rok = rokPozivaUpisnika(new Date()).toLocaleDateString("sr-RS");
      await posaljiAdminAlert(
        "Upisnik ZRNA čeka poziv radi potvrde",
        `„${pseudonim}" je upisao ZRNO i traži razgovor radi potvrde. Fondacija obezbeđuje da ga čuvar Kola pozove najkasnije do ${rok} (Pravilnik o dokazu stvarnosti čl. 4a).`,
      );
    } else {
      // Rok od sedam dana važi za svakoga na spisku (čl. 4a, set 4.8.3); Fondacija ga
      // ne može obezbediti ako ne zna da je neko dospeo na spisak. Bez pseudonima:
      // upozorenje ide i van EU (mejl, Telegram), a ko je na spisku vidi se na Potvrdama.
      const rok = rokPoziva(new Date(), false).toLocaleDateString("sr-RS");
      await posaljiAdminAlert(
        "Nov zahtev na spisku za poziv",
        `Neko je dospeo na spisak za poziv${radiPotvrde ? " radi potvrde" : ""}. Fondacija obezbeđuje da ga ${radiPotvrde ? "čuvar" : "član"} Kola pozove najkasnije do ${rok} (Pravilnik o dokazu stvarnosti čl. 4a).`,
      );
    }
  } catch (e) {
    console.error("[spisak-za-poziv] obaveštenje nije poslato", e);
  }
}

async function proveriClanaKola(userId: string): Promise<StatusUcesnika> {
  const u = await prisma.user.findFirst({ where: { id: userId, ...POTVRDJEN_AKTIVAN }, select: { id: true } });
  const status = u ? await ucitajStatus(userId) : null;
  if (!u || !status) throw new ZahtevGreska("Spisak za poziv vide samo članovi Kola.", 403);
  return status as StatusUcesnika;
}

/**
 * Spisak za poziv za člana Kola. 🔴 Ne vraća ni ime ni broj telefona — oni dolaze
 * samo u odgovoru na otvaranje (`otvoriPoziv`). Uz svaki red ide da li je poziv
 * zaključan kod drugog člana i da li je otvoren baš posmatraču.
 */
export async function spisakZaPoziv(posmatracId: string) {
  const posmatrac = await proveriClanaKola(posmatracId);
  const sada = new Date();
  await ocistiIstekla(sada);
  const redovi = await prisma.zahtevZaRazgovor.findMany({
    where: {
      userId: { not: posmatracId },
      user: { status: UserStatus.ACTIVE, deaktiviranAt: null, maloletan: false },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      osnov: true,
      mesto: true,
      opis: true,
      dostupnost: true,
      createdAt: true,
      otvorioId: true,
      otvorenDo: true,
      user: { select: { id: true, pseudonim: true } },
    },
  });
  // Zahtev radi potvrde vide samo čuvari Kola (čl. 4a); upisnik ZRNA je prvi.
  const vidljivi = redovi.filter((z) => smeVidetiRed(z.osnov, posmatrac));
  const { gazdinstvoZaRazgovorSaSpiska } = await import("./gazdinstvo");
  const sPrioritetom = await Promise.all(
    vidljivi.map(async (z) => ({
      ...z,
      prioritet: z.osnov === "POTVRDA" && (await upisaoZrno(z.user.id)),
      // Jedan razgovor (gazd. čl. 6a st. 2): nosilac čije gazdinstvo čeka razgovor.
      gazdinstvo: z.osnov === "GAZDINSTVO_RPG" ? await gazdinstvoZaRazgovorSaSpiska(z.user.id) : null,
    })),
  );
  return redosledSpiska(sPrioritetom).map((z) => {
    const zakljucan = brojZakljucan(z.otvorenDo, sada);
    const moj = zakljucan && z.otvorioId === posmatracId;
    return {
      id: z.id,
      osnov: z.osnov,
      prioritet: z.prioritet,
      rokPozivaDo: rokPoziva(z.createdAt, z.prioritet).toISOString(),
      gazdinstvo: z.gazdinstvo?.naziv ?? null,
      mesto: z.mesto,
      opis: z.opis,
      dostupnost: z.dostupnost,
      createdAt: z.createdAt.toISOString(),
      clan: z.user,
      zakljucan: zakljucan && !moj,
      otvorenMeni: moj,
      otvorenDo: moj ? z.otvorenDo?.toISOString() ?? null : null,
    };
  });
}

/**
 * Briše TEKUĆE otvaranje čiji je rok prošao (oslobađa poziv za ostale). Zapis o
 * tome ko je otvarao (`ZapisOtvaranjaPoziva`) se ne dira.
 */
async function ocistiIstekla(sada: Date) {
  await prisma.zahtevZaRazgovor.updateMany({
    where: { otvorenDo: { lte: sada } },
    data: { otvorioId: null, otvorenDo: null },
  });
}

/**
 * „Otvori ime i broj" (Uslovi čl. 16b st. 3). Uspeva samo ako poziv nije otvoren
 * kod drugog člana Kola i ako posmatrač nema drugi otvoren poziv; uslov je u samom
 * `updateMany`, pa je otvaranje atomično. U ISTOJ transakciji se upisuje
 * `ZapisOtvaranjaPoziva` (čl. 4a st. 5). Ponovni prikaz poziva koji je posmatraču
 * već otvoren ne produžava rok i ne pravi nov zapis.
 *
 * Vraća ime i prezime iz evidencije identiteta SAMO kad je upisano (za korisnika
 * bez upisanog imena otvara se samo broj), broj telefona i rok.
 */
export async function otvoriPoziv(posmatracId: string, zahtevId: string) {
  const posmatrac = await proveriClanaKola(posmatracId);
  const sada = new Date();
  await ocistiIstekla(sada);
  return prisma.$transaction(async (tx) => {
    const drugi = await tx.zahtevZaRazgovor.findFirst({
      where: { otvorioId: posmatracId, otvorenDo: { gt: sada }, id: { not: zahtevId } },
      select: { id: true },
    });
    if (drugi) throw new ZahtevGreska("Već imaš jedan otvoren poziv. Zatvori ga pre nego što otvoriš drugi.", 409);

    const z = await tx.zahtevZaRazgovor.findUnique({
      where: { id: zahtevId },
      select: { userId: true, osnov: true, otvorioId: true, otvorenDo: true },
    });
    if (!z) throw new ZahtevGreska("Ova osoba više nije na spisku.", 404);
    if (!smeVidetiRed(z.osnov, posmatrac))
      throw new ZahtevGreska("Zahtev radi potvrde otvara samo čuvar Kola.", 403);
    if (z.userId === posmatracId) throw new ZahtevGreska("To si ti.", 400);

    const vecMoj = z.otvorioId === posmatracId && brojZakljucan(z.otvorenDo, sada);
    if (!vecMoj) {
      const r = await tx.zahtevZaRazgovor.updateMany({
        where: { id: zahtevId, otvorenDo: null },
        data: { otvorioId: posmatracId, otvorenDo: otvorenDoOd(sada) },
      });
      if (r.count !== 1)
        throw new ZahtevGreska("Ime i broj je upravo otvorio drugi član Kola. Pokušaj malo kasnije.", 409);
      // 🔴 Fondacija beleži ko je podatke otvorio — u istoj transakciji sa otvaranjem.
      await tx.zapisOtvaranjaPoziva.create({ data: { pozvaniId: z.userId, otvorioId: posmatracId } });
    }

    const posle = await tx.zahtevZaRazgovor.findUniqueOrThrow({
      where: { id: zahtevId },
      select: { telefon: true, otvorenDo: true },
    });
    const identitet = await tx.identitetNaloga.findUnique({
      where: { userId: z.userId },
      select: { imePrezime: true },
    });
    return {
      imePrezime: identitet?.imePrezime ?? null,
      telefon: posle.telefon,
      otvorenDo: posle.otvorenDo!.toISOString(),
      pozvaniId: z.userId,
    };
  }).then(async ({ pozvaniId, ...r }) => ({
    ...r,
    // N4-M2: da li isti broj ili isto ime stoje uz drugi nalog — mesto, bez pseudonima.
    oznake: await oznakeZaNalog(pozvaniId),
  }));
}

/** Zatvaranje poziva pre isteka — oslobađa ga za ostale. Zapis otvaranja ostaje. */
export async function zatvoriPoziv(posmatracId: string, zahtevId: string) {
  await prisma.zahtevZaRazgovor.updateMany({
    where: { id: zahtevId, otvorioId: posmatracId },
    data: { otvorioId: null, otvorenDo: null },
  });
}

/**
 * Zapisi otvaranja za administratorski tim (čl. 4a st. 5; radnja br. 24): samo
 * pseudonim člana Kola, pseudonim pozvanog i vreme — bez imena i broja.
 */
export async function zapisiOtvaranja(opcije: { pseudonim?: string; limit?: number } = {}) {
  const q = opcije.pseudonim?.trim().toLowerCase();
  const redovi = await prisma.zapisOtvaranjaPoziva.findMany({
    where: q
      ? { OR: [{ otvorio: { pseudonimLower: q } }, { pozvani: { pseudonimLower: q } }] }
      : undefined,
    orderBy: { otvorenoAt: "desc" },
    take: Math.min(Math.max(opcije.limit ?? 200, 1), 500),
    select: {
      id: true,
      otvorenoAt: true,
      otvorio: { select: { id: true, pseudonim: true } },
      pozvani: { select: { id: true, pseudonim: true } },
    },
  });
  return redovi.map((r) => ({ ...r, otvorenoAt: r.otvorenoAt.toISOString() }));
}
