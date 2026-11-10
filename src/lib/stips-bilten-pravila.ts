/**
 * STIPS bilteni (set 5.1.3; donacije čl. 29 st. 1) — čista pravila, bez Prisme (CLAUDE.md
 * pravilo 9): čitanje spiska biltena i stranice biltena (HTML, regularnim izrazom), spisak
 * pijaca i sklapanje cene za Republiku Srbiju iz dominantnih cena pijaca (`prosekStips`).
 *
 * Brojevi u PDF-u biltena nisu izvučivi kao tekst, pa dominantne cene unosi administratorski
 * tim; ovde se samo pronalaze bilteni i PDF.
 */
import { prosekStips, type StipsCenaPijace } from "@/lib/stips-pravila";

export const STIPS_OSNOVA = "https://www.stips.minpolj.gov.rs";
export const STIPS_BILTENI_URL = `${STIPS_OSNOVA}/srl/bilteni`;

/** Vrsta biltena po delu adrese dokumenta. */
export const VRSTE_BILTENA = {
  ZIVA_STOKA: "ziva-stoka-zitarice-i-stocna-hrana",
  VOCE_POVRCE: "voce-i-povrce",
} as const;
export type VrstaBiltena = keyof typeof VRSTE_BILTENA;

/** Pijace iz biltena, redom kojim ih bilten navodi. */
export const PIJACE_STIPS = [
  "Beograd", "Čačak", "Kragujevac", "Kraljevo", "Loznica", "Niš", "Pirot", "Požarevac", "Smederevo", "Vranje",
  "Zaječar", "Leskovac", "Šabac", "Užice", "Kikinda", "Novi Sad", "Pančevo", "Sombor", "S. Mitrovica", "Subotica",
  "Zrenjanin",
] as const;

/** Kategorije iz biltena žive stoke koje se najčešće unose (ostale se dodaju po nazivu iz biltena). */
export const KATEGORIJE_PREDLOG: Record<VrstaBiltena, readonly string[]> = {
  ZIVA_STOKA: [
    "Bikovi >500kg SM", "Junad 400-500kg SM", "Telad 80-160kg SM", "Krave za klanje", "Jagnjad sve težine",
    "Prasad 16-25kg", "Tovljenici 80-120kg",
  ],
  VOCE_POVRCE: [],
};

export type BiltenSaSpiska = { vrsta: VrstaBiltena; broj: string; url: string };

/**
 * Bilteni sa stranice spiska: veze oblika `/srl/dokument/bilten-voce-i-povrce-442026`, gde su
 * poslednje četiri cifre godina, a cifre pre njih broj nedelje („44/2026”). Bez ponavljanja.
 */
export function procitajSpisakBiltena(html: string): BiltenSaSpiska[] {
  const izlaz: BiltenSaSpiska[] = [];
  const vidjeno = new Set<string>();
  const re = /href="((?:https?:\/\/www\.stips\.minpolj\.gov\.rs)?\/srl\/dokument\/bilten-([a-z-]+?)-(\d{1,2})(\d{4}))"/g;
  for (const m of html.matchAll(re)) {
    const vrsta = (Object.keys(VRSTE_BILTENA) as VrstaBiltena[]).find((v) => VRSTE_BILTENA[v] === m[2]);
    if (!vrsta) continue;
    const broj = `${Number(m[3])}/${m[4]}`;
    const kljuc = `${vrsta}|${broj}`;
    if (vidjeno.has(kljuc)) continue;
    vidjeno.add(kljuc);
    izlaz.push({ vrsta, broj, url: m[1].startsWith("http") ? m[1] : `${STIPS_OSNOVA}${m[1]}` });
  }
  return izlaz;
}

/** Veza na PDF sa stranice biltena (`/sites/default/files/…/BiltenSZ2344.pdf`), ili `null`. */
export function procitajPdfBiltena(html: string): string | null {
  const m = html.match(/href="((?:https?:\/\/www\.stips\.minpolj\.gov\.rs)?\/sites\/default\/files\/[^"]+?\.pdf)"/i);
  if (!m) return null;
  return m[1].startsWith("http") ? m[1] : `${STIPS_OSNOVA}${m[1]}`;
}

/** Adresa sme da bude samo na STIPS-u (link uz cenu je javna provera, ne proizvoljna veza). */
export function jeStipsAdresa(url: string): boolean {
  return url.startsWith(`${STIPS_OSNOVA}/`);
}

/**
 * Cena za Republiku Srbiju iz dominantnih cena pijaca jednog biltena (donacije čl. 29 st. 1):
 * pijace bez cene (prazno, nula, negativno) ne ulaze; prosek zaokružuje `prosekStips`.
 * Pijace se vraćaju redom iz biltena. `null` kad nijedna pijaca nema cenu.
 */
export function cenaIzPijaca(redovi: readonly { pijaca: string; cena: number }[]): { cena: number; pijace: StipsCenaPijace[] } | null {
  const vazece = redovi.filter((r) => Number.isFinite(r.cena) && r.cena > 0);
  const cena = prosekStips(vazece.map((r) => r.cena));
  if (cena == null) return null;
  const red = (p: string) => {
    const i = (PIJACE_STIPS as readonly string[]).indexOf(p);
    return i < 0 ? PIJACE_STIPS.length : i;
  };
  const pijace = [...vazece].sort((a, b) => red(a.pijaca) - red(b.pijaca) || a.pijaca.localeCompare(b.pijaca, "sr"))
    .map((r) => ({ pijaca: r.pijaca, cena: r.cena }));
  return { cena, pijace };
}

/** Rečenica o zaokruživanju (donacije čl. 29 st. 1) — ista u ugovoru i na ekranu. */
export const ZAOKRUZIVANJE_STIPS =
  "zaokružen na ceo dinar kada je manji od 100 dinara, na deset dinara kada iznosi od 100 do manje od 1.000 dinara, a na sto dinara kada iznosi 1.000 dinara ili više";

/** Unos jedne cene pijace: prazno = pijaca nije objavila cenu (`null`); inače pozitivan broj na dve decimale. */
export function procitajCenuPijace(v: unknown): { ok: true; cena: number | null } | { ok: false } {
  if (v === null || v === undefined || v === "") return { ok: true, cena: null };
  const n = Number(typeof v === "string" ? v.replace(",", ".") : v);
  if (!Number.isFinite(n) || n <= 0 || n > 10_000_000) return { ok: false };
  return { ok: true, cena: Math.round(n * 100) / 100 };
}
