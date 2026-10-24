/**
 * Dnevni tempo potvrđivanja — Pravilnik o dokazu stvarnosti čl. 8 (set 4.7.5).
 *
 * Bez Prisme: uvozi ga i pretraživač (ekran `/verifikacija` pokazuje upozorenje
 * PRE nego što čovek unese kod, ne tek posle).
 *
 * 🔴 Broj potvrda NIJE ograničen — ograničen je TEMPO. Verifikacioni kapacitet i
 * slotovi (indeks/10, dopuna ishodom nadzora „uredno") ukinuti su istim setom, po
 * odluci vlasnika 18.10.2026: „to u principu ne bi ograničavalo". Ne vraćati ih kao
 * drugu proveru pored ove.
 *
 * Važi za SVAKOGA, i za početne korisnike i nosioce ZRNA (odluka vlasnika). Izuzeta
 * je samo potvrda koju roditelj daje detetu na 18. rođendan — nju daje sistem, ne
 * čovek pred ekranom (`izvrsiVerifikacijuBezTokena`).
 *
 * Zaustavljanje NIJE suspenzija: staje samo potvrđivanje, do kraja dana. Suspenziju
 * celog naloga Fondacija izriče po postupku iz Uslova, ako proceni da treba.
 */

/** Pre ove potvrde u danu (i svake sledeće dozvoljene) ide upozorenje. */
export const PRAG_UPOZORENJA = 3;
/** Ova potvrda u danu se ne evidentira; potvrđivanje staje do kraja dana. */
export const PRAG_ZAUSTAVLJANJA = 5;

export type DnevniTempo = {
  /** Koliko je potvrda već dato danas. */
  danas: number;
  /** Koja bi po redu bila sledeća. */
  sledeca: number;
  /** Sme li sledeća da prođe. */
  sme: boolean;
  /** Ide li uz sledeću upozorenje (3. i 4. u danu). */
  upozorenje: boolean;
};

export function dnevniTempo(danas: number): DnevniTempo {
  const d = Math.max(0, Math.floor(danas));
  const sledeca = d + 1;
  const sme = sledeca < PRAG_ZAUSTAVLJANJA;
  return { danas: d, sledeca, sme, upozorenje: sme && sledeca >= PRAG_UPOZORENJA };
}

const ZONA = "Europe/Belgrade";

/**
 * Trenutak (UTC) u kome je počeo tekući kalendarski dan po srpskom vremenu.
 * Brojač se tim trenutkom vraća na nulu — „resetuje se na dnevnoj bazi".
 */
export function pocetakDana(trenutak: Date = new Date()): Date {
  const delovi = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(trenutak);
  const v = (tip: string) => Number(delovi.find((p) => p.type === tip)?.value);
  const lokalnoKaoUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  // Pomak zone u tom trenutku (1h zimi, 2h leti), zaokružen na minut.
  const pomak = Math.round((lokalnoKaoUtc - trenutak.getTime()) / 60_000) * 60_000;
  return new Date(Date.UTC(v("year"), v("month") - 1, v("day")) - pomak);
}
