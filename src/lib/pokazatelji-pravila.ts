/**
 * Pokazatelji sistema — čista pravila, bez Prisme (CLAUDE.md pravilo 9). Servisni
 * ulaz je `src/lib/protokol/pokazatelji.ts`.
 *
 * Četiri pokazatelja (odluka vlasnika 15.11.2026). Od tog dana su JEDINI pokazatelji
 * sistema: raniji pokazatelji zdravlja i koncentracije (Z1–Z11, K1–K10) su uklonjeni,
 * a njihovi dnevni snimci ostaju u tabeli `PokazateljDan` kao istorija.
 *
 * 🔴 Granice koje ova pravila drže (brana `__tests__/pokazatelji-sistema-izvor.test.ts`):
 *  1. Pokazatelj, cilj i boja NEMAJU DEJSTVO. Ne zaustavljaju upis ZRNA, glas,
 *     delegiranje ni emisiju — pokazatelj sa dejstvom bio bi kapa u drugom obliku.
 *     Ovaj fajl zato ne uvozi niko iz `zrno.ts`, `glasanje.ts` ni `emisija.ts`.
 *  2. Sve je ZBIR: nijedan broj nije po licu, nema POEN-a po licu ni dinarskog iznosa.
 *  3. Meri se samo živo (pravilo 19, `docs/merenje-stanja.md`): punoletni, aktivni
 *     nalozi; dete ne ulazi ni u jedan broj.
 *  4. Pokazatelji se NE SABIRAJU u jedan broj — svaki se čita za sebe.
 */

/**
 * Zbir nad manje od pet lica se ne iskazuje (zaštita podataka). Koristi ga registar
 * odluka Gornjeg Kola. 🔴 Četvrti pokazatelj je izuzetak po odluci vlasnika
 * (15.11.2026): glasovi se iskazuju čim prvo ZRNO bude aktivirano.
 */
export const MIN_LICA_U_ZBIRU = 5;

/** Prvi dan niza: prvi korisnici su ušli u sistem u junu 2026. */
export const POCETAK_NIZA = "2026-06-01";

/** Kategorije Pijace koje se broje kao ponuda hrane. */
export const KATEGORIJE_HRANE: readonly string[] = ["hrana-i-pice"];

export type SifraPokazatelja = "PONUDA" | "RAZMENE" | "KRUZENJE" | "GLASOVI";

/** Ciljevi u procentima. Tabela je jedna — ekran i javna ruta je čitaju odavde (pravilo 10). */
export const POKAZATELJI: readonly { sifra: SifraPokazatelja; cilj: number }[] = [
  /** Udeo korisnika koji imaju ponudu. */
  { sifra: "PONUDA", cilj: 50 },
  /** Broj razmena prema broju korisnika, zbirno od početka. */
  { sifra: "RAZMENE", cilj: 100 },
  /** Razmenjeni POEN prema POEN-u u opticaju, zbirno od početka. */
  { sifra: "KRUZENJE", cilj: 200 },
  /** Glasovi ostalih članova prema glasovima osnivača; pre Faze 2 vrednost je 0. */
  { sifra: "GLASOVI", cilj: 500 },
];

/**
 * Zbirni brojevi iz kojih se pokazatelji računaju. Ovo je i oblik dnevnog snimka
 * (`PokazateljSistemaDan.vrednosti`) — u snimak ne ulazi ništa drugo.
 */
export type SirovoStanje = {
  /** Punoletni, aktivni nalozi. */
  korisnici: number;
  /** Od toga u Kolu: član bez potvrde, član Kola, čuvar Kola, osnivač. */
  ucesnici: number;
  /** Korisnici sa bar jednim aktivnim oglasom kojim nude. */
  korisniciSaPonudom: number;
  /** Aktivni oglasi kojima se nudi. */
  ponude: number;
  /** Od toga u kategorijama hrane (`KATEGORIJE_HRANE`). */
  ponudeHrane: number;
  /** Odobrena gazdinstva čiji bar jedan član ima ponudu. */
  ponudjaciGazdinstva: number;
  /** Korisnici sa ponudom koji nisu članovi takvog gazdinstva. */
  ponudjaciPojedinci: number;
  /** Razmene od početka (`USLOV_RAZMENE`, obe strane žive i punoletne). */
  razmene: number;
  /** Zbir POEN-a u tim razmenama. */
  razmenjeniPoen: number;
  /** Ukupan broj POEN-a u evidenciji. */
  opticaj: number;
  /** Da li Gornje Kolo postoji (Faza 2). */
  faza2: boolean;
  /** Glasovi osnivača u sastavu Gornjeg Kola; `null` kad se ne mogu utvrditi (naknadno izračunat dan u Fazi 2). */
  glasoviOsnivaca: number | null;
  /** Glasovi ostalih čuvara Kola u sastavu; `null` kao gore. */
  glasoviOstalih: number | null;
};

export const KLJUCEVI_SIROVOG = [
  "korisnici",
  "ucesnici",
  "korisniciSaPonudom",
  "ponude",
  "ponudeHrane",
  "ponudjaciGazdinstva",
  "ponudjaciPojedinci",
  "razmene",
  "razmenjeniPoen",
  "opticaj",
  "faza2",
  "glasoviOsnivaca",
  "glasoviOstalih",
] as const satisfies readonly (keyof SirovoStanje)[];

/** Boja bara: ostvarenost ispod 50% crveno, od 50% žuto, od 100% zeleno (odluka vlasnika 15.11.2026). */
export type Boja = "CRVENO" | "ZUTO" | "ZELENO" | "SIVO";

export function boja(ostvarenost: number | null): Boja {
  if (ostvarenost === null || !Number.isFinite(ostvarenost)) return "SIVO";
  if (ostvarenost >= 100) return "ZELENO";
  if (ostvarenost >= 50) return "ZUTO";
  return "CRVENO";
}

export type StanjePokazatelja = {
  sifra: SifraPokazatelja;
  cilj: number;
  /** Procenat, na jednu decimalu; `null` kad se ne iskazuje (imenilac je nula). */
  vrednost: number | null;
  /** Vrednost prema cilju, u procentima, na jednu decimalu. */
  ostvarenost: number | null;
  boja: Boja;
};

const naDecimalu = (x: number) => Math.round(x * 10) / 10;

/** Odnos u procentima (nezaokružen); `null` kad je imenilac nula ili nepoznat. */
function odnos(deo: number | null, celina: number | null): number | null {
  if (deo === null || celina === null || celina <= 0) return null;
  return (deo / celina) * 100;
}

function nezaokruzeno(sifra: SifraPokazatelja, s: SirovoStanje): number | null {
  switch (sifra) {
    case "PONUDA":
      return odnos(s.korisniciSaPonudom, s.korisnici);
    case "RAZMENE":
      return odnos(s.razmene, s.korisnici);
    case "KRUZENJE":
      return odnos(s.razmenjeniPoen, s.opticaj);
    case "GLASOVI":
      // Pre Faze 2 Gornje Kolo ne postoji, pa je vrednost 0, a ne „nema podatka“.
      if (!s.faza2) return 0;
      return odnos(s.glasoviOstalih, s.glasoviOsnivaca);
  }
}

/** Četiri pokazatelja iz zbirnih brojeva, u redosledu iz `POKAZATELJI`. */
export function izracunaj(s: SirovoStanje): StanjePokazatelja[] {
  return POKAZATELJI.map(({ sifra, cilj }) => {
    const v = nezaokruzeno(sifra, s);
    // Ostvarenost se računa iz nezaokružene vrednosti, da se zaokruživanje ne množi.
    const ostvarenost = v === null ? null : naDecimalu((v / cilj) * 100);
    return { sifra, cilj, vrednost: v === null ? null : naDecimalu(v), ostvarenost, boja: boja(ostvarenost) };
  });
}

/** Ukupan broj ponuđača: gazdinstvo se broji jednom, ma koliko članova nudilo. */
export function ponudjaca(s: Pick<SirovoStanje, "ponudjaciGazdinstva" | "ponudjaciPojedinci">): number {
  return s.ponudjaciGazdinstva + s.ponudjaciPojedinci;
}

/**
 * Čita snimak iz baze (JSON). Vraća `null` ako oblik nije ispravan — takav dan se
 * ne prikazuje, umesto da se prikaže pogrešno.
 */
export function procitajSirovo(v: unknown): SirovoStanje | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const broj = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k]) ? (o[k] as number) : null);
  const obavezni = KLJUCEVI_SIROVOG.filter((k) => k !== "faza2" && k !== "glasoviOsnivaca" && k !== "glasoviOstalih");
  for (const k of obavezni) if (broj(k) === null) return null;
  return {
    korisnici: broj("korisnici")!,
    ucesnici: broj("ucesnici")!,
    korisniciSaPonudom: broj("korisniciSaPonudom")!,
    ponude: broj("ponude")!,
    ponudeHrane: broj("ponudeHrane")!,
    ponudjaciGazdinstva: broj("ponudjaciGazdinstva")!,
    ponudjaciPojedinci: broj("ponudjaciPojedinci")!,
    razmene: broj("razmene")!,
    razmenjeniPoen: broj("razmenjeniPoen")!,
    opticaj: broj("opticaj")!,
    faza2: o.faza2 === true,
    glasoviOsnivaca: broj("glasoviOsnivaca"),
    glasoviOstalih: broj("glasoviOstalih"),
  };
}

// ── Niz po danima ─────────────────────────────────────────────────────────────

export type DanNiza = {
  /** Dan na koji se stanje odnosi, `GGGG-MM-DD` (obračunski dan po srpskom vremenu). */
  dan: string;
  /** `true` kad dan nije snimljen te noći nego je naknadno izračunat iz evidencije. */
  naknadno: boolean;
  sirovo: SirovoStanje;
};

/** Po mesecima: stanje poslednjeg snimljenog dana u svakom mesecu. Niz mora biti rastući po danu. */
export function poMesecima(niz: readonly DanNiza[]): DanNiza[] {
  const poslednji = new Map<string, DanNiza>();
  for (const d of niz) poslednji.set(d.dan.slice(0, 7), d);
  return [...poslednji.values()];
}

const CSV_POKAZATELJI: Record<SifraPokazatelja, string> = {
  PONUDA: "ponuda",
  RAZMENE: "razmene_prema_korisnicima",
  KRUZENJE: "razmenjeno_prema_opticaju",
  GLASOVI: "glasovi_ostalih_prema_osnivacima",
};

/**
 * Niz kao CSV (zarez, tačka kao decimalni znak, prazno polje = ne iskazuje se).
 * Kolone: dan, oznaka naknadnog izračunavanja, zbirni brojevi, pa za svaki
 * pokazatelj vrednost i ostvarenost u procentima.
 */
export function nizUCsv(niz: readonly DanNiza[]): string {
  const zaglavlje = [
    "dan",
    "naknadno_izracunato",
    ...KLJUCEVI_SIROVOG,
    ...POKAZATELJI.flatMap((p) => [`${CSV_POKAZATELJI[p.sifra]}_procenat`, `${CSV_POKAZATELJI[p.sifra]}_ostvarenost`]),
  ];
  const polje = (x: number | boolean | null) => (x === null ? "" : typeof x === "boolean" ? (x ? "1" : "0") : String(x));
  const redovi = niz.map((d) => {
    const p = izracunaj(d.sirovo);
    return [
      d.dan,
      polje(d.naknadno),
      ...KLJUCEVI_SIROVOG.map((k) => polje(d.sirovo[k])),
      ...p.flatMap((x) => [polje(x.vrednost), polje(x.ostvarenost)]),
    ].join(",");
  });
  return [zaglavlje.join(","), ...redovi].join("\n") + "\n";
}

// ── Registar odluka Gornjeg Kola ──────────────────────────────────────────────

/**
 * Najmanji broj nosilaca čiji zbir PRELAZI polovinu ukupnog. `null` za prazan skup.
 * Koristi ga registar odluka (`/glasanje/registar`), ne pokazatelji.
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
