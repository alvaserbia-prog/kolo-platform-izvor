/**
 * Kutija želja u dečjem prostoru — ČISTA pravila, bez baze (whitepaper 5.0,
 * pogl. 7 „Dečji prostor"; odluka vlasnika 25.10.2026). Uvozi ga i pretraživač;
 * servis je `src/lib/protokol/kutija-zelja.ts`, koji ova pravila re-eksportuje.
 *
 * Dete predlaže novu funkciju, igru ili pravilo za dečji prostor i podržava predloge
 * druge dece, po jedan glas po predlogu. Fondacija svaki predlog pregleda PRE
 * prikaza (da u njemu nema ličnih podataka ni neprimerenog sadržaja), a na predloge
 * sa najviše podrške odgovara obrazloženo, jezikom koji dete razume.
 *
 * 🔴 Granice koje drže ovaj modul (i brana `__tests__/kutija-zelja-izvor.test.ts`):
 *  - predlog NE donosi POEN, nagradu ni rang — nema `emitujPoen`, nema `EMISIJA_*`,
 *    nema prikaza ko je najviše predlagao;
 *  - autor se NIKAD ne vraća klijentu — ni detetu, ni roditelju, ni adminu, ni kao
 *    id. Predlog se prikazuje bez imena i pseudonima;
 *  - Kutija nije kanal za razgovor: nema komentara ni odgovora među decom, samo
 *    predlog, podrška i odgovor Fondacije (deca: do 15 godina dete ne komunicira sa
 *    punoletnima, a ni ovde se ne otvara put do druge dece);
 *  - prikazuje se samo ono što je Fondacija pregledala (`PRIKAZAN`, `ODGOVOREN`);
 *  - punoletni nalog ne dobija ništa (osim admina u pregledu i roditelja, koji u
 *    pregledu deteta vidi SAMO tekst predloga sopstvenog deteta — odluka vlasnika
 *    25.10.2026).
 */
import type { StanjeDeteta } from "./deca-pravila";

export type Provera = { ok: true } | { ok: false; razlog: string; status: 400 | 403 | 404 | 409 | 429 };

/** Stanja predloga. `NA_PREGLEDU → PRIKAZAN | ODBIJEN`, pa `PRIKAZAN → ODGOVOREN`. */
export type StanjeZelje = "NA_PREGLEDU" | "PRIKAZAN" | "ODBIJEN" | "ODGOVOREN";

/** Najkraći i najduži tekst predloga (znakova, posle skraćivanja razmaka). */
export const TEKST_MIN = 10;
export const TEKST_MAX = 300;

/** Najviše otvorenih predloga po detetu (na pregledu ili prikazanih, bez odgovora). */
export const MAX_OTVORENIH = 3;

/** Najviše novih predloga po detetu u jednom danu (srpsko vreme). */
export const MAX_DNEVNO = 2;

/** Razlog odbijanja (prikazuje se detetu) i odgovor Fondacije — granice dužine. */
export const RAZLOG_MIN = 5;
export const RAZLOG_MAX = 500;
export const ODGOVOR_MIN = 20;
export const ODGOVOR_MAX = 1500;

export const PORUKA_SAMO_DECA = "Kutija želja postoji samo u dečjem prostoru.";
export const PORUKA_CEKA_RODITELJA_KUTIJA =
  "Kutija želja ti se otvara kad roditelj preuzme tvoj nalog.";

/**
 * Ko sme u Kutiju želja (da vidi, predloži i podrži): dete sa roditeljem i dete
 * Kola. Dete na čekanju ne — njegov nalog još nije preuzeo nijedan roditelj.
 * Punoletni nalog nikad (Kutija je samo u dečjem prostoru).
 */
export function smeUKutiju(u: { maloletan: boolean; stanje: StanjeDeteta }): Provera {
  if (!u.maloletan) return { ok: false, razlog: PORUKA_SAMO_DECA, status: 403 };
  if (u.stanje !== "POVEZANO" && u.stanje !== "AKTIVNO") {
    return { ok: false, razlog: PORUKA_CEKA_RODITELJA_KUTIJA, status: 403 };
  }
  return { ok: true };
}

/**
 * Tekst predloga kako se čuva: bez kontrolnih znakova, sa skraćenim razmacima.
 * Prelom reda ostaje jedan (dete piše kratko; prazni redovi nisu sadržaj).
 */
export function ocistiTekst(sirov: unknown): string {
  if (typeof sirov !== "string") return "";
  return sirov
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Da li je tekst predloga dovoljne i dozvoljene dužine. */
export function proveriTekst(tekst: string): Provera {
  const n = [...tekst].length;
  if (n < TEKST_MIN) {
    return { ok: false, razlog: `Napiši malo više — bar ${TEKST_MIN} slova.`, status: 400 };
  }
  if (n > TEKST_MAX) {
    return { ok: false, razlog: `Predlog može da ima najviše ${TEKST_MAX} slova.`, status: 400 };
  }
  return { ok: true };
}

/** Sme li dete da pošalje nov predlog, s obzirom na to koliko ih već ima. */
export function smePredloziti(u: { otvorenih: number; danas: number }): Provera {
  if (u.otvorenih >= MAX_OTVORENIH) {
    return {
      ok: false,
      razlog: `Već imaš ${MAX_OTVORENIH} predloga koji čekaju. Kad Fondacija odgovori ili kad neki povučeš, možeš da pošalješ nov.`,
      status: 429,
    };
  }
  if (u.danas >= MAX_DNEVNO) {
    return { ok: false, razlog: `Danas možeš da pošalješ najviše ${MAX_DNEVNO} predloga. Sutra možeš ponovo.`, status: 429 };
  }
  return { ok: true };
}

/** Otvoren predlog: još nije ni odbijen ni dobio odgovor. Broji se u `MAX_OTVORENIH`. */
export function jeOtvoren(stanje: StanjeZelje): boolean {
  return stanje === "NA_PREGLEDU" || stanje === "PRIKAZAN";
}

/** Predlog koji vidi druga deca — samo posle pregleda Fondacije. */
export function jePrikazan(stanje: StanjeZelje): boolean {
  return stanje === "PRIKAZAN" || stanje === "ODGOVOREN";
}

/** Stanja koja deca vide u zajedničkoj listi (za Prisma upit). */
export const STANJA_PRIKAZA: StanjeZelje[] = ["PRIKAZAN", "ODGOVOREN"];

/**
 * Sme li dete da podrži predlog (ili da povuče podršku). Podrška se daje samo
 * prikazanom predlogu na koji Fondacija još nije odgovorila — posle odgovora broj
 * ostaje kakav je bio. Svoj predlog dete ne podržava.
 */
export function smePodrzati(u: { stanje: StanjeZelje; moj: boolean }): Provera {
  if (u.moj) return { ok: false, razlog: "Svoj predlog ne možeš da podržiš — podrži predloge druge dece.", status: 403 };
  if (u.stanje === "ODGOVOREN") {
    return { ok: false, razlog: "Fondacija je na ovaj predlog već odgovorila.", status: 409 };
  }
  if (u.stanje !== "PRIKAZAN") return { ok: false, razlog: "Predlog nije pronađen.", status: 404 };
  return { ok: true };
}

/** Autor sme da povuče svoj predlog dok je otvoren (briše se). */
export function smePovuci(u: { stanje: StanjeZelje; moj: boolean }): Provera {
  if (!u.moj) return { ok: false, razlog: "Predlog nije pronađen.", status: 404 };
  if (!jeOtvoren(u.stanje)) {
    return { ok: false, razlog: "Ovaj predlog je već završen, pa ne može da se povuče.", status: 409 };
  }
  return { ok: true };
}

// ── Odluke Fondacije ────────────────────────────────────────────────────────

export type RadnjaFondacije = "PRIKAZI" | "ODBIJ" | "ODGOVORI";

/**
 * Prelaz stanja po odluci Fondacije. Fondacija predlog ne prepravlja (moderacija je
 * uklanjanje, nikad prepravka) — samo ga prikazuje, odbija uz razlog, ili na
 * prikazan predlog odgovara.
 */
export function proveriOdluku(
  stanje: StanjeZelje,
  radnja: RadnjaFondacije,
  tekst: string,
): Provera & { novoStanje?: StanjeZelje } {
  const n = [...tekst].length;
  if (radnja === "PRIKAZI") {
    if (stanje !== "NA_PREGLEDU") return { ok: false, razlog: "Predlog je već pregledan.", status: 409 };
    return { ok: true, novoStanje: "PRIKAZAN" };
  }
  if (radnja === "ODBIJ") {
    if (stanje !== "NA_PREGLEDU") return { ok: false, razlog: "Predlog je već pregledan.", status: 409 };
    if (n < RAZLOG_MIN || n > RAZLOG_MAX) {
      return { ok: false, razlog: `Razlog odbijanja je obavezan (${RAZLOG_MIN}–${RAZLOG_MAX} znakova).`, status: 400 };
    }
    return { ok: true, novoStanje: "ODBIJEN" };
  }
  if (stanje !== "PRIKAZAN") {
    return { ok: false, razlog: "Odgovara se samo na prikazan predlog bez odgovora.", status: 409 };
  }
  if (n < ODGOVOR_MIN || n > ODGOVOR_MAX) {
    return { ok: false, razlog: `Odgovor je obavezan (${ODGOVOR_MIN}–${ODGOVOR_MAX} znakova).`, status: 400 };
  }
  return { ok: true, novoStanje: "ODGOVOREN" };
}

// ── Prikaz ──────────────────────────────────────────────────────────────────

/** Ono što dete vidi o predlogu u zajedničkoj listi. 🔴 Bez autora, bez id-ja autora. */
export type PrikazZelje = {
  id: string;
  tekst: string;
  stanje: "PRIKAZAN" | "ODGOVOREN";
  brojPodrski: number;
  /** Da li je posmatrač ovaj predlog podržao. */
  podrzao: boolean;
  /** Da li je ovo predlog samog posmatrača (on to sme da zna; drugi ne saznaju čiji je). */
  moj: boolean;
  odgovor: { tekst: string; datum: string } | null;
};

export type RedZaPrikaz = {
  id: string;
  tekst: string;
  stanje: StanjeZelje;
  autorId: string;
  createdAt: Date;
  podrske: { deteId: string }[];
  odgovor: { tekst: string; createdAt: Date } | null;
};

/**
 * Od reda baze pravi prikaz za dete-posmatrača. Jedino mesto koje oblikuje ono što
 * ide klijentu: `autorId` se ovde koristi samo za `moj`, i ne izlazi.
 */
export function prikaziZelju(red: RedZaPrikaz, posmatracId: string): PrikazZelje | null {
  if (!jePrikazan(red.stanje)) return null;
  return {
    id: red.id,
    tekst: red.tekst,
    stanje: red.stanje as "PRIKAZAN" | "ODGOVOREN",
    brojPodrski: red.podrske.length,
    podrzao: red.podrske.some((p) => p.deteId === posmatracId),
    moj: red.autorId === posmatracId,
    odgovor: red.odgovor ? { tekst: red.odgovor.tekst, datum: red.odgovor.createdAt.toISOString() } : null,
  };
}

/**
 * Redosled: najviše podrške prvo, pa noviji. Fondacija odgovara na predloge sa
 * najviše podrške, pa ih tim redom vidi i dete.
 */
export function poredak<T extends { brojPodrski: number; datum: number }>(a: T, b: T): number {
  return b.brojPodrski - a.brojPodrski || b.datum - a.datum;
}
