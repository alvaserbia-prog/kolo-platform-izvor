// Razrešavanje unetog mesta u naziv iz šifarnika naselja (`naselja-srbije.ts`).
//
// ZAŠTO POSTOJI: polje „mesto/lokacija" je do sada bilo SLOBODAN TEKST — padajuća
// lista je samo predlagala naselja, a `onChange` je upisivao svaki otkucani znak.
// Tako je nastalo „Stanišić (Sombor)": čovek je hteo da bude jasan i upisao je i
// selo i opštinu. Formalno bezazleno, praktično nije: takav zapis ne pogađa nijedno
// naselje iz šifarnika, pa mu se ne mogu izračunati koordinate (udaljenost na
// Pijaci), niti se poklapa sa filterom po mestu.
//
// Zato je izbor mesta sada JEDNA stavka iz šifarnika, svuda isto (kartica jemstva
// je to već tražila). Ovaj modul je jedino mesto gde se ta provera radi — dele ga
// klijentska pretraga (`LokacijaSearch`), API rute i obračun udaljenosti.

import { NASELJA_SRBIJE } from "./naselja-srbije";

/** Mala slova, bez srpskih dijakritika, sažeti razmaci — za poređenje unosa. */
export function normalizujNaselje(s: string): string {
  return s
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

// normalizovan naziv → kanonski zapis iz šifarnika („stanisic" → „Stanišić")
const INDEKS: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const naselje of NASELJA_SRBIJE) {
    const kljuc = normalizujNaselje(naselje);
    if (!m.has(kljuc)) m.set(kljuc, naselje);
  }
  return m;
})();

/**
 * Vraća kanonski naziv naselja za uneti tekst, ili `null` ako nije prepoznat.
 *
 * Toleriše se ono što je očigledno jedno mesto zapisano opširnije:
 *   „stanisic"            → „Stanišić"   (bez dijakritika / mala slova)
 *   „Stanišić (Sombor)"   → „Stanišić"   (selo + opština u zagradi)
 *   „Novi Sad, Liman"     → „Novi Sad"   (deo naselja iza zareza)
 *   „Stanišić - Sombor"   → „Stanišić"
 * Uvek se zadržava PRVI, uži pojam — ako je čovek naveo i selo i opštinu, selo je
 * precizniji podatak. Ono što se ne razreši ni tako NIJE naselje iz šifarnika.
 */
export function razresiNaselje(unos: unknown): string | null {
  if (typeof unos !== "string") return null;
  const s = unos.trim().replace(/\s+/g, " ");
  if (!s) return null;

  const kandidati = [
    s,
    // dodatak u zagradi na kraju: „Stanišić (Sombor)"
    s.replace(/\s*\([^)]*\)\s*$/, ""),
    // sve iza zareza / kose crte / crtice okružene razmacima
    s.split(/[,/;]|\s[-–—]\s/)[0],
  ];

  for (const kandidat of kandidati) {
    const kljuc = normalizujNaselje(kandidat);
    if (!kljuc) continue;
    const naselje = INDEKS.get(kljuc);
    if (naselje) return naselje;
  }
  return null;
}

/** Da li uneti tekst pogađa naselje iz šifarnika (prazno se ne računa). */
export function jeNaseljeIzSifarnika(unos: unknown): boolean {
  return razresiNaselje(unos) !== null;
}

/** Jedinstvena poruka greške — ista na klijentu i u API rutama. */
export const PORUKA_MESTO_IZ_SPISKA =
  "Mesto mora biti izabrano iz ponuđenog spiska naselja — upiši samo jedno mesto.";
