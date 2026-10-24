/**
 * Dnevni iznosi socijalnih programa (Pravilnik o programima podrške) — čista
 * pravila, bez Prisme (pravilo 9). Čita ih obračun (`protokol/programi.ts`) i
 * ekran Programi, pa opis programa ne može da se razide sa obračunom (pravilo 10).
 */

/** Podrška majkama: osnovica po detetu, umanjenje po godini uzrasta, trajanje. */
export const MAJKE_OSNOVICA = 2000;
export const MAJKE_UMANJENJE_PO_GODINI = 100;
export const MAJKE_TRAJANJE_GODINA = 20;

/** Podrška starijima: osnovica od navršenih godina, plus iznos po godini preko toga. */
export const STARIJI_OSNOVICA = 1000;
export const STARIJI_PO_GODINI = 100;
export const STARIJI_OD_GODINA = 50;

/** Posebna podrška i školovanje: stalan dnevni iznos. */
export const POSEBNA_PODRSKA_DNEVNO = 2000;
export const SKOLOVANJE_DNEVNO = 2000;
