/**
 * Celine operativnog doprinosa (Pravilnik o operativnom doprinosu čl. 5, 6 i 15,
 * set 4.8.5; registar rizika 2026-10, S1-M1/M2). ČISTA pravila, bez Prisme.
 *
 * Zadatak se deli na celine — male delove posla, po pravilu takve da se jedna
 * završava u jednom danu. Predlagač zadatka utvrđuje predloženi POEN ZA JEDNU
 * CELINU i broj celina; predloženi POEN za potpuno izvršenje je njihov proizvod.
 * Izvršilac uz dokaz navodi samo KOLIKO je celina izvršio — iznos ne određuje on.
 *
 * 🔴 Zašto: kada je izvršilac sam upisivao POEN za svaki dan rada, zapis je
 * ličio na dnevnicu koju čovek sam sebi zaračunava. Celina se određuje prema
 * delu posla, a ne prema utrošenom vremenu (čl. 6 st. 1 i 3) — zato je opis celine
 * obavezan. 🔴 Predloženi POEN zadatka više ne može biti 0 („bez ograničenja"),
 * a procena obima rada je obavezna (čl. 5 t. 4). Zatečeni zadaci bez celina
 * (`brojCelina = null`) rade po starom pravilu dok se ne zatvore; ne popunjavaju
 * se naknadno (pravilo 11).
 */

export const MAX_BROJ_CELINA = 1000;
export const MAX_POEN_PO_CELINI = 1_000_000;
/** Brava na unos, ne pravilo akta: zbir celog zadatka. */
export const MAX_POEN_ZADATKA = 10_000_000;
export const MIN_DUZINA_OPISA = 5;

export type UnosCelina = {
  poenPoCelini: unknown;
  brojCelina: unknown;
  opisCeline: unknown;
  procenaObima: unknown;
};

export type ProveraCelina =
  | { ok: true; poenPoCelini: number; brojCelina: number; opisCeline: string; procenaObima: string; predlozeniPoen: number }
  | { ok: false; greska: string };

const tekst = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Provera zadatka pri objavi i izmeni (čl. 5–6). */
export function proveriCelineZadatka(u: UnosCelina): ProveraCelina {
  const po = Number(u.poenPoCelini);
  const broj = Number(u.brojCelina);
  const opis = tekst(u.opisCeline);
  const procena = tekst(u.procenaObima);
  if (!Number.isInteger(po) || po < 1 || po > MAX_POEN_PO_CELINI)
    return { ok: false, greska: `Predloženi POEN za jednu celinu mora biti ceo broj od 1 do ${MAX_POEN_PO_CELINI.toLocaleString("sr-RS")}.` };
  if (!Number.isInteger(broj) || broj < 1 || broj > MAX_BROJ_CELINA)
    return { ok: false, greska: `Broj celina mora biti ceo broj od 1 do ${MAX_BROJ_CELINA}.` };
  if (po * broj > MAX_POEN_ZADATKA)
    return { ok: false, greska: `Predloženi POEN za ceo zadatak ne može preći ${MAX_POEN_ZADATKA.toLocaleString("sr-RS")}.` };
  if (opis.length < MIN_DUZINA_OPISA)
    return { ok: false, greska: "Opiši šta je jedna celina — deo posla, ne vreme." };
  if (procena.length < MIN_DUZINA_OPISA)
    return { ok: false, greska: "Procena obima rada je obavezna." };
  return { ok: true, poenPoCelini: po, brojCelina: broj, opisCeline: opis, procenaObima: procena, predlozeniPoen: po * broj };
}

/** POEN jedne celine — predloženi POEN zadatka je uvek tačan proizvod. */
export function poenPoCelini(predlozeniPoen: number, brojCelina: number): number {
  return Math.floor(predlozeniPoen / brojCelina);
}

/**
 * Izvršenje celina (čl. 15): izvršilac navodi broj izvršenih celina; predloženi
 * POEN zapisa je broj celina × POEN po celini. Zbir celina (bez odbijenih) ne
 * prelazi broj celina zadatka.
 */
export function proveriIzvrsenjeCelina(p: {
  celina: unknown;
  brojCelinaZadatka: number;
  predlozeniPoenZadatka: number;
  dosadasnjeCeline: number;
}): { ok: true; celina: number; predlozeniPoen: number } | { ok: false; greska: string } {
  const c = Number(p.celina);
  if (!Number.isInteger(c) || c < 1) return { ok: false, greska: "Broj izvršenih celina mora biti pozitivan ceo broj." };
  const preostalo = p.brojCelinaZadatka - p.dosadasnjeCeline;
  if (c > preostalo)
    return { ok: false, greska: preostalo > 0 ? `Preostalo je još ${preostalo} celina ovog zadatka.` : "Sve celine ovog zadatka su već prijavljene." };
  return { ok: true, celina: c, predlozeniPoen: c * poenPoCelini(p.predlozeniPoenZadatka, p.brojCelinaZadatka) };
}
