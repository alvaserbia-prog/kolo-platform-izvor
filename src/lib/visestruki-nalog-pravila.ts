/**
 * Višestruki nalog istog lica — čista pravila (Pravilnik o dokazu stvarnosti čl. 4a
 * i 4b, Pravilnik o KOLO sistemu čl. 14 st. 3 t. 8; set 4.8.4; registar 2026-10,
 * N4-M2 i N4-M3). Bez Prisme: uvozi ih i pretraživač.
 *
 * Jedinstvenost se ne dokazuje (nema isprave ni JMBG-a, Pravilnik čl. 31), pa se
 * ne jemči ni verifikacijom. Umesto toga: zabrana (Uslovi čl. 8), poređenje i
 * odluka čoveka.
 *
 * 🔴 Poređenje NIŠTA NE BLOKIRA. Isti broj telefona dele supružnici, a isto ime i
 * prezime nose imenjaci; oznaka je obaveštenje pozivaocu i Fondaciji, a o
 * višestrukom nalogu odlučuje samo Fondacija (superadmin, `utvrdiVisestrukiNalog`).
 *
 * 🔴 Pozivalac (član Kola, čuvar) vidi da poklapanje postoji i MESTO drugog naloga,
 * nikad njegov pseudonim: inače bi saznao kako se zove neko treći, ko možda samo
 * nosi isto ime. Oba naloga vidi samo superadmin. Brana `n4-jedinstvenost-izvor.test.ts`.
 */
import { kljucImena } from "./identitet-pravila";

export { kljucImena };

/**
 * Ključ poređenja broja telefona: samo cifre, domaći oblik sveden na međunarodni
 * (06x… → 3816x…, 00381… → 381…). „064 123 4567", „+381 64 123-4567" i
 * „00381641234567" daju isti ključ. Kraći od šest cifara nije ključ.
 */
export function kljucTelefona(telefon: string | null | undefined): string | null {
  if (!telefon) return null;
  let c = telefon.replace(/\D/g, "");
  if (c.startsWith("00")) c = c.slice(2);
  if (c.startsWith("0")) c = "381" + c.slice(1);
  return c.length >= 6 ? c : null;
}

/** Šta se poklapa sa drugim nalozima — ono što pozivalac sme da vidi. */
export type OznakeDuplikata = {
  /** Isti broj telefona stoji uz bar jedan drugi nalog. */
  istiTelefon: boolean;
  /** Mesta drugih naloga sa istim imenom i prezimenom (bez pseudonima); „" kad mesto nije upisano. */
  istoImeMesta: string[];
};

export type DrugiNalog = { telefon: string | null; imePrezime: string | null; mesto: string | null };

/** Oznake za jedan nalog prema skupu drugih naloga. Čista funkcija. */
export function oznakeDuplikata(
  moj: { telefon: string | null; imePrezime: string | null },
  drugi: DrugiNalog[],
): OznakeDuplikata {
  const kt = kljucTelefona(moj.telefon);
  const ki = kljucImena(moj.imePrezime);
  const istiTelefon = kt !== null && drugi.some((d) => kljucTelefona(d.telefon) === kt);
  const istoImeMesta = ki === null
    ? []
    : [...new Set(drugi.filter((d) => kljucImena(d.imePrezime) === ki).map((d) => d.mesto ?? ""))];
  return { istiTelefon, istoImeMesta };
}

export function imaOznaku(o: OznakeDuplikata): boolean {
  return o.istiTelefon || o.istoImeMesta.length > 0;
}

/**
 * Neto prepis sa ugašenog naloga na nalog koji ostaje (Pravilnik čl. 14 st. 3 t. 8):
 * zbir prepisa sa ugašenog na zadržani, umanjen za prepise u suprotnom smeru. Otpisuje
 * se samo pozitivan ostatak — ono što je lice samo vratilo ne kažnjava se.
 */
export function netoPrepisa(saUgasenog: number, naUgaseni: number): number {
  return Math.max(0, Math.round(saUgasenog) - Math.round(naUgaseni));
}

/** Najkraće obrazloženje utvrđenja i zatvaranja predmeta (znakova). */
export const MIN_OBRAZLOZENJE = 10;
