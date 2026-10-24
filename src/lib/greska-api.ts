import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { prevedi } from "./prevod-servera";

/**
 * Odgovor sa greškom, preveden na jeziku korisnika.
 *
 * API rute su u kontekstu zahteva i nose kolačić `NEXT_LOCALE`, pa server može
 * sam da prevede poruku. Zato ekrani ostaju NETAKNUTI — nema potrebe da klijent
 * prima ključ i prevodi ga, kao što je prvi plan predviđao.
 *
 * **Srpski tekst je ujedno ključ.** Pozivno mesto piše rečenicu kao i pre
 * (`greska("Nedovoljno POEN-a.", 400)`), a `kljucGreske()` iz nje izvodi
 * deterministički ključ u `messages.greske`. Time nema ručnog imenovanja
 * ključeva niti mogućnosti da se ime i tekst razmimoiđu. Ako prevod nedostaje,
 * vraća se srpski original — ruta nikad ne puca.
 */

/** Srpski tekst → ključ u `messages.greske`. Mora biti isto i u skripti koja puni prevode. */
export function kljucGreske(poruka: string): string {
  const bezDijakritike = poruka
    .replace(/č/g, "c").replace(/ć/g, "c").replace(/š/g, "s")
    .replace(/ž/g, "z").replace(/đ/g, "dj")
    .replace(/Č/g, "C").replace(/Ć/g, "C").replace(/Š/g, "S")
    .replace(/Ž/g, "Z").replace(/Đ/g, "Dj");
  return bezDijakritike
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

/**
 * JSON odgovor `{ error }` na jeziku korisnika.
 *
 * `poruka` sme da bude `undefined` (npr. `e.message` iz izuzetka) — tada se
 * vraća opšta poruka umesto da ruta pukne dok već obrađuje grešku.
 */
export async function greska(
  poruka: string | undefined | null,
  status = 400,
  init?: ResponseInit,
): Promise<NextResponse> {
  const tekst = poruka?.trim() || "Greška.";
  const locale = await getLocale();
  const prevedeno = prevedi(locale, `greske.${kljucGreske(tekst)}`, undefined, tekst);
  return NextResponse.json({ error: prevedeno }, { ...init, status });
}
