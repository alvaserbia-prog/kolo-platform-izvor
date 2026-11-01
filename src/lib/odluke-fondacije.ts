import { promises as fs } from "fs";
import path from "path";

const BAZA = path.join(process.cwd(), "odluke-fondacije");

/**
 * Odluke Upravnog odbora koje se objavljuju na sajtu (Statut čl. 21: odluke od
 * značaja za korisnike; čl. 22 st. 4: opšti akt stupa na snagu najranije danom
 * objave na internet stranici). Tekst je doslovna kopija odluke iz
 * `arhiva-fondacije/` — brana `odluke-fondacije-izvor.test.ts`.
 *
 * Naslov i opis se čitaju iz `odluke.stavke.<slug>`. Tekst odluke postoji samo
 * na srpskom: odluka nema prevod, pa se svim jezicima prikazuje original uz
 * napomenu `odluke.samo_srpski`.
 *
 * 🔴 `objavljena` je dan kada je odluka prvi put objavljena na ekolo.rs — za
 * Poslovnik je to dan stupanja na snagu. Ne menja se posle objave.
 */
export const ODLUKE = [
  {
    slug: "poslovnik-upravnog-odbora",
    broj: 1,
    fajl: "01_odluka-1_poslovnik-uo.md",
    doneta: "01.11.2026.",
    objavljena: "02.11.2026.",
  },
  {
    slug: "merila-lice-za-zastitu-podataka",
    broj: 5,
    fajl: "05_odluka-5_merila-lice-zastita-podataka.md",
    doneta: "01.11.2026.",
    objavljena: "02.11.2026.",
  },
] as const;

export type Odluka = (typeof ODLUKE)[number];

export function nadjiOdluku(slug: string): Odluka | undefined {
  return ODLUKE.find((o) => o.slug === slug);
}

export async function ucitajOdluku(o: Odluka): Promise<string> {
  return fs.readFile(path.join(BAZA, o.fajl), "utf-8");
}
