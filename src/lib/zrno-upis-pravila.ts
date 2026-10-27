/**
 * Čista pravila upisa ZRNA (Pravilnik čl. 22; Pravilnik o osnivačkom doprinosu čl. 9).
 * Bez Prisme — uvozi ih i ekran ZRNA; server ih dobija kroz `protokol/zrno.ts`.
 *
 * - ZRNO se upisuje od Faze 2 (čl. 22 st. 1, čl. 41), pod istim uslovima za sve
 *   učesnike, 🔴 uključujući osnivače: svojstvo početnog čuvara Kola (čl. 58) ne daje
 *   izuzeće ni upis u Fazi 1. Fazu 2 nosi jednosmerna oznaka `ZrnoKanal.isActive`,
 *   koju postavlja prelaz po pragu (`faza-sistema.ts`).
 * - U jednom obračunskom periodu učesnik na upis troši najviše 1% evidentiranih
 *   POEN-a (čl. 22 st. 4).
 */

/** Najveći deo evidentiranih POEN-a koji se u jednom obračunskom periodu troši na upis ZRNA, u procentima (čl. 22 st. 4). */
export const PROCENAT_UPISA_ZRNA_PO_PERIODU = 1;

/** Najviše POEN-a za upis ZRNA u jednom obračunskom periodu (čl. 22 st. 4); celobrojno, bez greške pokretnog zareza. */
export function najviseZaUpisZrna(evidentiranoPoen: number): number {
  return Math.floor((Math.max(0, evidentiranoPoen) * PROCENAT_UPISA_ZRNA_PO_PERIODU) / 100);
}

/**
 * Upis ZRNA je otvoren samo u Fazi 2 (čl. 22 st. 1) — za svakoga, i za osnivača.
 * Proverava se i pri podnošenju zahteva i pri izvršenju u ponoć.
 */
export function upisZrnaOtvoren(kanal: { isActive: boolean } | null | undefined): boolean {
  return kanal?.isActive === true;
}
