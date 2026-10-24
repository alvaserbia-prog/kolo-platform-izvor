/**
 * Pravila za korisnika (nalog koji niko nije ni uveo u Kolo ni potvrdio) — ČISTE
 * funkcije, bez baze. Osnov: Uslovi korišćenja čl. 14, 16 st. 4 i čl. 16b;
 * Pravilnik o dokazu stvarnosti čl. 4a (set 4.8.2). Ime fajla ostaje iz seta 4.8.1.
 *
 * Korisnik učestvuje u razmeni: objavljuje ponudu i potražnju, prepisuje POEN i
 * piše u Pričaonici. Dve stvari su mu uže, i obe su ovde:
 *  - razgovor sme prvi da pokrene samo sa oglašivačem, povodom njegovog oglasa, i
 *    najviše `NOVIH_RAZGOVORA_DNEVNO` puta u danu (srpsko vreme);
 *  - ko ne poznaje nijednog člana Kola, javlja se kroz spisak za poziv („Želim da
 *    me neko nazove"); ime i broj telefona članovi Kola otvaraju jedan po jedan.
 *
 * Bez Prisme: uvozi ga i pretraživač.
 */
import type { OsnovSpiska } from "./spisak-za-poziv-pravila";
import { procitajImePrezime } from "./identitet-pravila";

export type Provera = { ok: true } | { ok: false; razlog: string; status: 400 | 403 | 409 | 429 };

/** Najviše novih razgovora koje korisnik sme da pokrene u jednom danu. */
export const NOVIH_RAZGOVORA_DNEVNO = 3;

/**
 * Sme li korisnik da pokrene NOV razgovor.
 *
 * `povodOglasom` je istina samo kad je oglas zaista oglas druge strane — to
 * proverava ruta. Već postojeći razgovor se ne broji i ne zaustavlja: u njemu
 * korisnik ionako sme da odgovara.
 */
export function smeNovRazgovor(u: { povodOglasom: boolean; pokrenutihDanas: number }): Provera {
  if (!u.povodOglasom)
    return {
      ok: false,
      razlog: "Dok te niko ne uvede u Kolo, razgovor možeš da pokreneš sa oglašivačem, sa stranice njegovog oglasa.",
      status: 403,
    };
  if (u.pokrenutihDanas >= NOVIH_RAZGOVORA_DNEVNO)
    return {
      ok: false,
      razlog: `Dok te niko ne uvede u Kolo, možeš da pokreneš najviše ${NOVIH_RAZGOVORA_DNEVNO} nova razgovora dnevno. Već otvoreni razgovori ti ostaju.`,
      status: 429,
    };
  return { ok: true };
}

// ── Spisak za poziv („Želim da me neko nazove", Uslovi čl. 16b) ──────────────

/** Koliko dugo je poziv (ime i broj) otvoren jednom članu Kola (Uslovi čl. 16b st. 3). */
export const BROJ_OTVOREN_MINUTA = 10;

/** Najduži opis „čime se baviš" i dostupnosti. */
export const MAX_OPIS_ZAHTEVA = 300;
export const MAX_DOSTUPNOST = 120;

/**
 * Broj telefona: cifre, razmaci, crtice, kose crte, zagrade i vodeći „+". Najmanje
 * šest cifara. Ne proverava se da li broj postoji — to se vidi kad se pozove.
 */
export function ispravanTelefon(t: string): boolean {
  const s = t.trim();
  if (!/^\+?[0-9 ()/-]+$/.test(s)) return false;
  const cifre = s.replace(/\D/g, "");
  return cifre.length >= 6 && cifre.length <= 15;
}

export type UnosZahteva = {
  /** Osnov dospeća na spisak (dokaz stvarnosti čl. 4a st. 2). Izostavljen = ZAHTEV. */
  osnov?: OsnovSpiska;
  /**
   * Ime i prezime (set 4.8.4, N4-M2): uslov za spisak za svaki osnov. Upisuje se u
   * evidenciju identiteta (Pravilnik čl. 31a, izvor SPISAK_ZA_POZIV).
   */
  imePrezime: string;
  mesto: string | null;
  opis: string;
  dostupnost: string;
  telefon: string;
  pristanak: boolean;
};

/**
 * Sadržinska provera unosa pre upisa na spisak.
 *
 * Ime i prezime, mesto i broj telefona su obavezni za svaki osnov (set 4.8.4,
 * N4-M2; dokaz stvarnosti čl. 4a): čuvaju se uz nalog i porede sa drugim nalozima.
 * Opis i dostupnost su obavezni samo kad korisnik sam traži razgovor (osnov ZAHTEV —
 * Uslovi čl. 16b st. 1 t. 1). Pristanak je obavezan uvek (st. 2).
 */
export function proveriZahtev(u: UnosZahteva): Provera {
  const zahtev = (u.osnov ?? "ZAHTEV") === "ZAHTEV";
  // Zahtev radi potvrde (dokaz čl. 5c st. 3): čuvar Kola treba da zna kada da zove.
  const radiPotvrde = u.osnov === "POTVRDA";
  if (!u.pristanak)
    return {
      ok: false,
      razlog: "Bez pristanka da član Kola vidi tvoje ime i broj telefona ne možeš na spisak.",
      status: 400,
    };
  if (!procitajImePrezime(u.imePrezime).ok) return { ok: false, razlog: "Upiši ime i prezime.", status: 400 };
  if (!u.mesto) return { ok: false, razlog: "Izaberi mesto iz spiska.", status: 400 };
  if (zahtev && !u.opis.trim()) return { ok: false, razlog: "Napiši ukratko čime se baviš.", status: 400 };
  if (u.opis.length > MAX_OPIS_ZAHTEVA)
    return { ok: false, razlog: `Opis može imati najviše ${MAX_OPIS_ZAHTEVA} znakova.`, status: 400 };
  if ((zahtev || radiPotvrde) && !u.dostupnost.trim())
    return { ok: false, razlog: "Napiši kada si dostupan za razgovor.", status: 400 };
  if (u.dostupnost.length > MAX_DOSTUPNOST)
    return { ok: false, razlog: `Dostupnost može imati najviše ${MAX_DOSTUPNOST} znakova.`, status: 400 };
  if (!ispravanTelefon(u.telefon)) return { ok: false, razlog: "Upiši ispravan broj telefona.", status: 400 };
  return { ok: true };
}

/**
 * Da li je poziv trenutno otvoren nekome (zaključan za ostale).
 * Poziv je otvoren dok `otvorenDo` nije prošao.
 */
export function brojZakljucan(otvorenDo: Date | null, sada: Date = new Date()): boolean {
  return otvorenDo !== null && otvorenDo.getTime() > sada.getTime();
}

/** Do kada je poziv otvoren ako se otvori sada. */
export function otvorenDoOd(sada: Date = new Date()): Date {
  return new Date(sada.getTime() + BROJ_OTVOREN_MINUTA * 60_000);
}
