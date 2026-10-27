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

/** Posebna podrška i Podrška studentima (interno `SKOLOVANJE`): stalan dnevni iznos. */
export const POSEBNA_PODRSKA_DNEVNO = 2000;
export const SKOLOVANJE_DNEVNO = 2000;

/**
 * Zajednički dnevni limit programa podrške i operativnog doprinosa (programi
 * čl. 10 st. 1; operativni čl. 20 st. 1): udeo ukupnog broja POEN-a evidentiranih
 * u sistemu NA POČETKU obračunskog perioda.
 *
 * 🔴 Operativni parametar koji menja UO odlukom (operativni čl. 20 st. 3) — zato
 * stoji ovde, imenovan, a ne kao `* 0.1` rasut po ekranima i obračunu.
 */
export const DNEVNI_LIMIT_UDEO = 0.1;

/** Dnevni limit u POEN-ima za dati opticaj; ceo broj, naniže (u korist Protokola). */
export function dnevniLimit(opticaj: number): number {
  return Math.floor(opticaj * DNEVNI_LIMIT_UDEO);
}

/**
 * Opticaj na početku obračunskog perioda (operativni čl. 20 st. 1), izveden iz
 * današnjeg stanja Protokola tako što se poništi svako kretanje Protokola od
 * početka perioda: ulaz u Protokol je stanje podigao, izlaz ga je spustio.
 *
 * Protokol je u minusu (zero-sum), pa je opticaj apsolutna vrednost tog stanja.
 */
export function opticajNaPocetkuPerioda(args: {
  stanjeProtokolaSada: number;
  ulazUProtokolOdPocetka: number;
  izlazIzProtokolaOdPocetka: number;
}): number {
  const stanjeNaPocetku =
    args.stanjeProtokolaSada - args.ulazUProtokolOdPocetka + args.izlazIzProtokolaOdPocetka;
  return Math.abs(stanjeNaPocetku);
}
