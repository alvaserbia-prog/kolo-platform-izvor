/**
 * Pokazatelji zdravlja i koncentracije KOLO sistema — čista pravila, bez Prisme
 * (CLAUDE.md pravilo 9). Servisni ulaz je `src/lib/protokol/pokazatelji.ts`.
 *
 * Zapis i obrazloženja: `docs/provera-akata/koncentracija-5-0.md` (odluke vlasnika
 * 25.10.2026: 1a–7a; stranica `/sistem/zdravlje` sa lampicama).
 *
 * 🔴 Tri granice koje ova pravila drže:
 *  1. Smernica i lampica NEMAJU DEJSTVO. Ne zaustavljaju upis ZRNA, glas,
 *     delegiranje ni emisiju — pokazatelj sa dejstvom bio bi kapa u drugom obliku
 *     (kapa na glasačku moć i na deo opticaja su odbijene mere). Ovaj fajl zato ne
 *     uvozi niko iz `zrno.ts`, `glasanje.ts` ni `emisija.ts` (brana
 *     `koncentracija-izvor.test.ts`).
 *  2. Pokazatelji su nad STANJEM, ne nad tokovima između lica — nijedan ne gleda ko
 *     je kome prepisao (praćenje obrazaca prepisa je odbijena mera).
 *  3. Zbir koji obuhvata manje od `MIN_LICA_U_ZBIRU` lica se ne iskazuje, da se iz
 *     njega ne bi prepoznao pojedinac (kao dan sa jednim primaocem podrške).
 */

/** Zbir nad manje od pet lica se ne iskazuje (zaštita podataka). */
export const MIN_LICA_U_ZBIRU = 5;

/** Mere glasačke moći (K6–K10) iskazuju se tek kad Gornje Kolo ima bar ovoliko čuvara. */
export const MIN_SASTAV_ZA_MOC = 10;

/** Prozor za pokazatelje razmene i aktivnosti. */
export const PROZOR_DANA = 30;

/** „Stalna ponuda“ gazdinstva (Z5): aktivan oglas kojim nudi, neprekidno toliko dana. */
export const DANA_STALNE_PONUDE = 28;

/** Prozor za put ulaska u Kolo. */
export const PROZOR_ULASKA_DANA = 90;

/**
 * Lampica: SIVO = pokazatelj se još ne iskazuje (nema podataka, premalo lica, ili
 * deo sistema još ne postoji, npr. Gornje Kolo u Fazi 1); ostale tri su ocena prema
 * smernici. Ocena nije odluka i nema posledicu.
 */
export type Lampica = "SIVO" | "CRVENO" | "ZUTO" | "ZELENO";

/**
 * Smernica: `MANJE` — manja vrednost je bolja (koncentracija); `VISE` — veća je
 * bolja (razmena, aktivnost). Granice su uključive: za `MANJE` vrednost ≤ zeleno je
 * zelena, ≤ žuto žuta, inače crvena; za `VISE` obrnuto.
 */
export type Smernica = { smer: "MANJE" | "VISE"; zeleno: number; zuto: number };

export function lampica(vrednost: number | null, s: Smernica): Lampica {
  if (vrednost === null || !Number.isFinite(vrednost)) return "SIVO";
  if (s.smer === "MANJE") {
    if (vrednost <= s.zeleno) return "ZELENO";
    if (vrednost <= s.zuto) return "ZUTO";
    return "CRVENO";
  }
  if (vrednost >= s.zeleno) return "ZELENO";
  if (vrednost >= s.zuto) return "ZUTO";
  return "CRVENO";
}

export type Grupa = "ZDRAVLJE" | "KONCENTRACIJA";
export type Jedinica = "PROCENAT" | "BROJ";
/** Ko vidi pokazatelj (odluka 3a: svi, kao zbir; izuzeci odluka 2a i zapis, odeljak 5). */
export type Vidljivost = "SVI" | "UCESNIK" | "ADMIN";

export type SifraPokazatelja =
  | "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "Z6" | "Z7" | "Z8" | "Z9" | "Z10" | "Z11"
  | "K1" | "K2" | "K3" | "K4" | "K4D" | "K5" | "K6" | "K7" | "K8" | "K9" | "K10";

export type DefinicijaPokazatelja = {
  sifra: SifraPokazatelja;
  grupa: Grupa;
  jedinica: Jedinica;
  smernica: Smernica;
  vidi: Vidljivost;
};

/**
 * Jedina tabela pokazatelja i smernica — ekran je čita odavde (pravilo 10), a tekst
 * (naziv, opis, smernica rečima) je u `messages/sr.json`, namespace `zdravlje`.
 * Procenti su 0–100.
 */
export const POKAZATELJI: readonly DefinicijaPokazatelja[] = [
  // ── Zdravlje zajedničkog dobra ──────────────────────────────────────────────
  /** Z1: deo razmena (30 dana) u kojima nijedna strana nije osnivač — kritična masa. */
  { sifra: "Z1", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "VISE", zeleno: 50, zuto: 20 }, vidi: "SVI" },
  /** Z2: deo aktivnih punoletnih naloga koji su bili strana u razmeni (30 dana), bez parova. */
  { sifra: "Z2", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "VISE", zeleno: 30, zuto: 10 }, vidi: "SVI" },
  /** Z3: deo verifikacija (90 dana) obavljenih posle razgovora sa spiska za poziv. */
  { sifra: "Z3", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 30, zuto: 50 }, vidi: "SVI" },
  /** Z4: deo zahteva na spisku za poziv kojima je rok za poziv prošao. */
  { sifra: "Z4", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 0, zuto: 20 }, vidi: "UCESNIK" },
  /** Z5: deo odobrenih gazdinstava čiji član neprekidno `DANA_STALNE_PONUDE` dana ima aktivan oglas kojim nudi. */
  { sifra: "Z5", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "VISE", zeleno: 70, zuto: 40 }, vidi: "SVI" },
  /** Z6: deo zadruga koje imaju najmanje `MIN_ZADRUGARA` zadrugara. */
  { sifra: "Z6", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "VISE", zeleno: 100, zuto: 50 }, vidi: "SVI" },
  /** Z7: deo projekata (nabavki) u dinarskom odlivu Fondacije u tekućoj godini. */
  { sifra: "Z7", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "VISE", zeleno: 50, zuto: 25 }, vidi: "SVI" },
  /** Z8: broj mesta sa najmanje `MIN_LICA_U_ZBIRU` aktivnih punoletnih naloga. */
  { sifra: "Z8", grupa: "ZDRAVLJE", jedinica: "BROJ", smernica: { smer: "VISE", zeleno: 5, zuto: 2 }, vidi: "SVI" },
  /** Z9: deo aktivnih punoletnih naloga koji su bili aktivni u poslednjih 30 dana. */
  { sifra: "Z9", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "VISE", zeleno: 40, zuto: 20 }, vidi: "SVI" },
  /** Z10: deo aktivnih punoletnih naloga sa negativnim zapisom (nadoknada). */
  { sifra: "Z10", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 1, zuto: 5 }, vidi: "ADMIN" },
  /** Z11: deo nabavki u kojima je prijava bilo više nego delova, pa je odlučivalo prvenstvo. */
  { sifra: "Z11", grupa: "ZDRAVLJE", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 20, zuto: 50 }, vidi: "SVI" },

  // ── Koncentracija ───────────────────────────────────────────────────────────
  /** K1: deo opticaja koji drži 10 najvećih zapisa. */
  { sifra: "K1", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 40, zuto: 60 }, vidi: "SVI" },
  /** K2: deo opticaja u zapisima osnivača. */
  { sifra: "K2", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 25, zuto: 33 }, vidi: "SVI" },
  /** K3: osnivački doprinos (kanal) u ukupnom broju POEN-a. */
  { sifra: "K3", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 25, zuto: 30 }, vidi: "SVI" },
  /** K4: najveći deo jednog kanala (bez dinarskih) u ukupnom broju POEN-a. */
  { sifra: "K4", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 40, zuto: 60 }, vidi: "SVI" },
  /** K4D: deo POEN-a iz donacija i pokroviteljstva — tačno samo admin (odluka 2a). */
  { sifra: "K4D", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 40, zuto: 60 }, vidi: "ADMIN" },
  /** K5: deo upisanog ZRNA koji drži 5 najvećih imalaca. */
  { sifra: "K5", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 30, zuto: 50 }, vidi: "SVI" },
  /** K6: najmanji broj čuvara koji glasaju čija moć prelazi polovinu (posle delegiranja). */
  { sifra: "K6", grupa: "KONCENTRACIJA", jedinica: "BROJ", smernica: { smer: "VISE", zeleno: 7, zuto: 4 }, vidi: "SVI" },
  /** K7: efektivan broj glasača kao deo čuvara koji glasaju. */
  { sifra: "K7", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "VISE", zeleno: 50, zuto: 33 }, vidi: "SVI" },
  /** K8: koliko koren ublažava — deo moći 5 najvećih kao procenat njihovog dela aktivnog ZRNA. */
  { sifra: "K8", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 50, zuto: 75 }, vidi: "UCESNIK" },
  /** K9: deo glasačke moći koji nose delegati umesto drugih. */
  { sifra: "K9", grupa: "KONCENTRACIJA", jedinica: "PROCENAT", smernica: { smer: "MANJE", zeleno: 30, zuto: 50 }, vidi: "SVI" },
  /** K10: u poslednjem zatvorenom glasanju — najmanji broj glasača čija moć čini većinu datih glasova. */
  { sifra: "K10", grupa: "KONCENTRACIJA", jedinica: "BROJ", smernica: { smer: "VISE", zeleno: 7, zuto: 4 }, vidi: "SVI" },
];

export function smeVidetiPokazatelj(vidi: Vidljivost, posmatrac: { ucesnik: boolean; admin: boolean }): boolean {
  if (vidi === "SVI") return true;
  if (vidi === "UCESNIK") return posmatrac.ucesnik || posmatrac.admin;
  return posmatrac.admin;
}

// ── Formule ───────────────────────────────────────────────────────────────────

/** Procenat zaokružen na jednu decimalu; `null` kad je imenilac nula. */
export function procenat(deo: number, celina: number): number | null {
  if (celina <= 0) return null;
  return Math.round((deo / celina) * 1000) / 10;
}

/** Iskazuje se samo kad zbir obuhvata najmanje `MIN_LICA_U_ZBIRU` lica. */
export function iskaziAkoDovoljno<T>(brojLica: number, vrednost: T): T | null {
  return brojLica >= MIN_LICA_U_ZBIRU ? vrednost : null;
}

/**
 * Deo zbira koji drži `n` najvećih (u procentima). `null` kad bi iskaz otkrio
 * pojedinca: skup ima manje od `2n` članova (ostatak bi bio premali) ili manje od
 * `MIN_LICA_U_ZBIRU`.
 */
export function deoNajvecih(vrednosti: readonly number[], n: number): number | null {
  const poz = vrednosti.filter((v) => v > 0).sort((a, b) => b - a);
  if (poz.length < Math.max(2 * n, MIN_LICA_U_ZBIRU)) return null;
  const ukupno = poz.reduce((s, v) => s + v, 0);
  const vrh = poz.slice(0, n).reduce((s, v) => s + v, 0);
  return procenat(vrh, ukupno);
}

/**
 * Najmanji broj nosilaca čiji zbir PRELAZI polovinu ukupnog (Nakamoto koeficijent).
 * `null` za prazan skup.
 */
export function najmanjiBrojZaVecinu(moci: readonly number[]): number | null {
  const poz = moci.filter((m) => m > 0).sort((a, b) => b - a);
  const ukupno = poz.reduce((s, m) => s + m, 0);
  if (ukupno <= 0) return null;
  let zbir = 0;
  for (let i = 0; i < poz.length; i++) {
    zbir += poz[i];
    if (zbir * 2 > ukupno) return i + 1;
  }
  return poz.length;
}

/** Efektivan broj nosilaca: 1 / Σ sᵢ², sᵢ = deo i-tog u ukupnom (Laakso–Taagepera). */
export function efektivanBroj(moci: readonly number[]): number | null {
  const poz = moci.filter((m) => m > 0);
  const ukupno = poz.reduce((s, m) => s + m, 0);
  if (ukupno <= 0) return null;
  const sumaKv = poz.reduce((s, m) => s + (m / ukupno) ** 2, 0);
  return 1 / sumaKv;
}
