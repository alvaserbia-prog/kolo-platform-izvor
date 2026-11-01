/**
 * Hrana u KOLO sistemu — čista pravila (bez Prisme), setovi 5.0.2 i 5.0.5.
 *
 * Izvor: Pravilnik o pokroviteljstvu i donacijama čl. 22 st. 4–8 (koeficijent evidencije
 * hrane: mera i lokalne sirovine), čl. 28 st. 2 t. 6 i st. 3 (pitanja u prijavi); Pravilnik o projektima i
 * kolektivnim nabavkama čl. 31 st. 1 (broj POEN-a po vaučeru za hranu obuhvata koeficijent)
 * i glava X (program raspodele hrane, čl. 38–47); Pravilnik o KOLO sistemu čl. 17 st. 2 t. 9.
 *
 * 🔴 Tabela živi SAMO ovde (pravilo 10) — ekran i servis je čitaju, ne prepisuju.
 * 🔴 Koeficijent hrane nije cena, nije kurs i ne izražava vrednost hrane u POEN-ima
 *    (donacije čl. 22 st. 7). Uz broj POEN-a po vaučeru se ne prikazuje dinarska vrednost.
 */

// ─── Kategorizacija hrane (donacije čl. 22 st. 4–8, set 5.0.5) ───────────────
//
// Koeficijent određuju dve stvari, iste za svaku vrstu hrane:
//  - MERA: broj stalnih radnika (bez ukućana, bez sezonskih), osim kad broj grla ili
//    površina pređe tvrdu granicu — tada je proizvodnja industrijska;
//  - LOKALNE SIROVINE: koliko su hrana za životinje, đubrivo i zaštita bilja sopstveni
//    ili lokalni — daju umanjenja.
// Koeficijent = osnova po meri − umanjenja, nikad ispod 1,00. Davalac odgovara na pitanja,
// koeficijent ne vidi i ne bira; sistem ga izvodi, a Fondacija prihvatanjem prijave
// utvrđuje (čl. 22 st. 5).

/** Vrsta hrane (donacije čl. 22 st. 4). Alkoholna pića se ne primaju (čl. 30). */
export const VRSTE_HRANE = ["MESO", "MLEKO", "JAJA", "VOCE", "POVRCE", "ZITARICE", "MED", "PRERADJEVINE", "FABRICKA"] as const;
export type VrstaHrane = (typeof VRSTE_HRANE)[number];

export const ZIVOTINJSKE: readonly VrstaHrane[] = ["MESO", "MLEKO", "JAJA"];
export const BILJNE: readonly VrstaHrane[] = ["VOCE", "POVRCE", "ZITARICE"];

/** Kategorija po meri (čl. 22 st. 5). */
export type Kategorija = "DOMACE" | "PORODICNA_FARMA" | "INDUSTRIJSKO" | "FABRICKA";

/** Granica stalnih radnika: do nje je domaće ili porodična farma, preko nje industrijsko. */
export const MAKS_RADNIKA_NEINDUSTRIJSKO = 5;

/** Vrsta grla za tvrdu granicu (čl. 22 st. 6; kapacitet, grla istovremeno u uzgoju). */
export const VRSTE_GRLA = [
  "SVINJE_TOV", "KRMACE", "GOVEDA_TOV", "KRAVE_MUZARE", "OVCE_KOZE", "BROJLERI", "KOKE_NOSILJE", "CURKE_PATKE_GUSKE", "KUNICI",
] as const;
export type VrstaGrla = (typeof VRSTE_GRLA)[number];

/** Tvrde granice broja grla — iznad je proizvodnja industrijska bez obzira na radnike. */
export const TVRDA_GRANICA_GRLA: Readonly<Record<VrstaGrla, number>> = {
  SVINJE_TOV: 1000, KRMACE: 150, GOVEDA_TOV: 200, KRAVE_MUZARE: 200, OVCE_KOZE: 500,
  BROJLERI: 10_000, KOKE_NOSILJE: 5000, CURKE_PATKE_GUSKE: 2000, KUNICI: 200,
};

/** Tvrde granice površine u hektarima (povrće: plastenik se računa trostruko). */
export const TVRDA_GRANICA_HA: Readonly<Partial<Record<VrstaHrane, number>>> = { POVRCE: 5, VOCE: 10, ZITARICE: 50 };
export const FAKTOR_PLASTENIKA = 3;

/** Osnova po meri, u stotim delovima (200 = 2,00), da se ne računa sa razlomcima. */
const OSNOVA: Readonly<Record<VrstaHrane, Readonly<Record<"DOMACE" | "PORODICNA_FARMA" | "INDUSTRIJSKO", number>>>> = {
  MESO: { DOMACE: 200, PORODICNA_FARMA: 180, INDUSTRIJSKO: 150 },
  MLEKO: { DOMACE: 200, PORODICNA_FARMA: 180, INDUSTRIJSKO: 150 },
  JAJA: { DOMACE: 200, PORODICNA_FARMA: 180, INDUSTRIJSKO: 150 },
  VOCE: { DOMACE: 150, PORODICNA_FARMA: 150, INDUSTRIJSKO: 120 },
  POVRCE: { DOMACE: 150, PORODICNA_FARMA: 150, INDUSTRIJSKO: 120 },
  ZITARICE: { DOMACE: 150, PORODICNA_FARMA: 150, INDUSTRIJSKO: 120 },
  MED: { DOMACE: 150, PORODICNA_FARMA: 150, INDUSTRIJSKO: 120 },
  PRERADJEVINE: { DOMACE: 150, PORODICNA_FARMA: 150, INDUSTRIJSKO: 120 },
  FABRICKA: { DOMACE: 100, PORODICNA_FARMA: 100, INDUSTRIJSKO: 100 },
};

/** Najniži koeficijent (čl. 22 st. 4): umanjenja ga ne spuštaju ispod 1,00. */
export const NAJNIZI_KOEFICIJENT = 100;

/** Odgovori na pitanja o lokalnim sirovinama (čl. 28 st. 2 t. 6). */
export type UdeoHrane = "PREKO_70" | "OD_30_DO_70" | "ISPOD_30";
export type IshranaKrava = "PASA_SENO" | "SILAZA_KONCENTRAT";
export type Djubrenje = "ORGANSKO_KOMBINOVANO" | "VESTACKO";
export type Zastita = "BEZ_PO_POTREBI" | "PO_KALENDARU";

export const UDELI_HRANE: readonly UdeoHrane[] = ["PREKO_70", "OD_30_DO_70", "ISPOD_30"];
export const ISHRANE_KRAVA: readonly IshranaKrava[] = ["PASA_SENO", "SILAZA_KONCENTRAT"];
export const DJUBRENJA: readonly Djubrenje[] = ["ORGANSKO_KOMBINOVANO", "VESTACKO"];
export const ZASTITE: readonly Zastita[] = ["BEZ_PO_POTREBI", "PO_KALENDARU"];

/** Umanjenja (čl. 22 st. 7), u stotim delovima. */
export const UMANJENJE_UDEO: Readonly<Record<UdeoHrane, number>> = { PREKO_70: 0, OD_30_DO_70: 10, ISPOD_30: 20 };
export const UMANJENJE_SILAZA = 10;
export const UMANJENJE_KAVEZ = 10;
export const UMANJENJE_VESTACKO = 10;
export const UMANJENJE_KALENDAR = 10;

/** Odgovori iz prijave (snimak ide uz ugovor). */
export type OdgovoriHrane = {
  vrsta: VrstaHrane;
  opisProizvodnje: string;
  stalnihRadnika: number;
  vrstaGrla?: VrstaGrla | null;
  brojGrla?: number | null;
  povrsinaHa?: number | null;
  plastenikHa?: number | null;
  udeoHrane?: UdeoHrane | null;
  ishranaKrava?: IshranaKrava | null;
  kavezi?: boolean | null;
  organskiSertifikat?: boolean | null;
  djubrenje?: Djubrenje | null;
  zastita?: Zastita | null;
};

export function jeVrstaHrane(v: unknown): v is VrstaHrane {
  return typeof v === "string" && (VRSTE_HRANE as readonly string[]).includes(v);
}

/** Mera (čl. 22 st. 5–6): kategorija po radnicima i tvrdoj granici. */
export function kategorijaHrane(o: OdgovoriHrane): Kategorija {
  if (o.vrsta === "FABRICKA") return "FABRICKA";
  const radnika = Math.max(0, Math.trunc(o.stalnihRadnika));
  if (ZIVOTINJSKE.includes(o.vrsta)) {
    const granica = o.vrstaGrla ? TVRDA_GRANICA_GRLA[o.vrstaGrla] : null;
    if (granica != null && (o.brojGrla ?? 0) > granica) return "INDUSTRIJSKO";
    if (radnika > MAKS_RADNIKA_NEINDUSTRIJSKO) return "INDUSTRIJSKO";
    return radnika === 0 ? "DOMACE" : "PORODICNA_FARMA";
  }
  // Biljke, med, prerađevine: do 5 radnika jedna kategorija (domaće), preko — industrijsko;
  // kod biljaka i iznad tvrde granice površine.
  if (radnika > MAKS_RADNIKA_NEINDUSTRIJSKO) return "INDUSTRIJSKO";
  const granicaHa = TVRDA_GRANICA_HA[o.vrsta];
  if (granicaHa != null) {
    const ha = Math.max(0, o.povrsinaHa ?? 0) + (o.vrsta === "POVRCE" ? Math.max(0, o.plastenikHa ?? 0) * (FAKTOR_PLASTENIKA - 1) : 0);
    if (ha > granicaHa) return "INDUSTRIJSKO";
  }
  return "DOMACE";
}

/** Lokalne sirovine (čl. 22 st. 7): zbir umanjenja u stotim delovima. */
export function umanjenjaHrane(o: OdgovoriHrane): number {
  switch (o.vrsta) {
    case "MESO":
      return o.udeoHrane ? UMANJENJE_UDEO[o.udeoHrane] : 0;
    case "MLEKO":
      return o.ishranaKrava === "SILAZA_KONCENTRAT" ? UMANJENJE_SILAZA : 0;
    case "JAJA":
      return (o.udeoHrane ? UMANJENJE_UDEO[o.udeoHrane] : 0) + (o.kavezi ? UMANJENJE_KAVEZ : 0);
    case "VOCE":
    case "POVRCE":
    case "ZITARICE":
      if (o.organskiSertifikat) return 0;
      return (o.djubrenje === "VESTACKO" ? UMANJENJE_VESTACKO : 0) + (o.zastita === "PO_KALENDARU" ? UMANJENJE_KALENDAR : 0);
    default:
      return 0;
  }
}

/** Koeficijent hrane: osnova − umanjenja, nikad ispod 1,00 (čl. 22 st. 4). */
export function koeficijentIzOdgovora(o: OdgovoriHrane): { kategorija: Kategorija; koeficijent: number } {
  const kategorija = kategorijaHrane(o);
  const osnova = kategorija === "FABRICKA" ? OSNOVA.FABRICKA.DOMACE : OSNOVA[o.vrsta][kategorija];
  const stotih = Math.max(NAJNIZI_KOEFICIJENT, osnova - umanjenjaHrane(o));
  return { kategorija, koeficijent: stotih / 100 };
}

/** Čita i proverava odgovore iz prijave (čl. 28 st. 2 t. 6). */
export function procitajOdgovoreHrane(
  b: Record<string, unknown>,
): { ok: true; odgovori: OdgovoriHrane } | { ok: false; razlog: string } {
  const tekst = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
  const broj = (v: unknown) => (v === "" || v == null ? null : Number(v));
  const daJe = (v: unknown) => v === true || v === "true";
  if (!jeVrstaHrane(b.vrstaHrane)) return { ok: false, razlog: "Izaberi vrstu hrane." };
  const vrsta = b.vrstaHrane;
  const opis = tekst(b.opisProizvodnje);
  if (opis.length < 5 || opis.length > 300) return { ok: false, razlog: "Opiši proizvodnju (vrsta, broj grla ili površina, način)." };
  const radnika = Number(b.stalnihRadnika);
  if (!Number.isInteger(radnika) || radnika < 0 || radnika > 100_000) return { ok: false, razlog: "Upiši broj stalnih radnika (0 ako ih nema)." };
  const o: OdgovoriHrane = { vrsta, opisProizvodnje: opis, stalnihRadnika: radnika };
  if (ZIVOTINJSKE.includes(vrsta)) {
    const vg = b.vrstaGrla;
    if (typeof vg !== "string" || !(VRSTE_GRLA as readonly string[]).includes(vg)) return { ok: false, razlog: "Izaberi vrstu životinja." };
    const bg = broj(b.brojGrla);
    if (bg == null || !Number.isInteger(bg) || bg < 1) return { ok: false, razlog: "Upiši broj grla." };
    o.vrstaGrla = vg as VrstaGrla;
    o.brojGrla = bg;
    if (vrsta === "MESO" || vrsta === "JAJA") {
      if (typeof b.udeoHrane !== "string" || !(UDELI_HRANE as readonly string[]).includes(b.udeoHrane))
        return { ok: false, razlog: "Izaberi udeo sopstvene ili lokalne hrane za životinje." };
      o.udeoHrane = b.udeoHrane as UdeoHrane;
    }
    if (vrsta === "JAJA") o.kavezi = daJe(b.kavezi);
    if (vrsta === "MLEKO") {
      if (typeof b.ishranaKrava !== "string" || !(ISHRANE_KRAVA as readonly string[]).includes(b.ishranaKrava))
        return { ok: false, razlog: "Izaberi čime se krave hrane." };
      o.ishranaKrava = b.ishranaKrava as IshranaKrava;
    }
  }
  if (BILJNE.includes(vrsta)) {
    const ha = broj(b.povrsinaHa);
    if (ha == null || !Number.isFinite(ha) || ha <= 0) return { ok: false, razlog: "Upiši površinu u hektarima." };
    o.povrsinaHa = ha;
    if (vrsta === "POVRCE") {
      const pl = broj(b.plastenikHa);
      o.plastenikHa = pl != null && Number.isFinite(pl) && pl > 0 ? pl : 0;
    }
    o.organskiSertifikat = daJe(b.organskiSertifikat);
    if (!o.organskiSertifikat) {
      if (typeof b.djubrenje !== "string" || !(DJUBRENJA as readonly string[]).includes(b.djubrenje))
        return { ok: false, razlog: "Izaberi čime đubriš." };
      if (typeof b.zastita !== "string" || !(ZASTITE as readonly string[]).includes(b.zastita))
        return { ok: false, razlog: "Izaberi kako štitiš biljke." };
      o.djubrenje = b.djubrenje as Djubrenje;
      o.zastita = b.zastita as Zastita;
    }
  }
  return { ok: true, odgovori: o };
}

/**
 * Nabavke čl. 31 st. 1 i čl. 43 st. 2 — broj POEN-a po vaučeru za hranu: vrednost sa
 * koeficijentom, podeljena brojem vaučera, zaokružena na najbliži ceo broj. Izvodi se iz
 * upisa (vrednost × koeficijent je ono što je evidentirano), ne iz odnosa prema novcu.
 */
export function poenaPoVauceruHrane(vrednost: number, koeficijent: number, brojVaucera: number): number {
  if (!Number.isInteger(brojVaucera) || brojVaucera < 1) return 0;
  return Math.round((vrednost * koeficijent) / brojVaucera);
}

// ─── Program raspodele hrane (nabavke glava X) ──────────────────────────────

/** Nabavke čl. 44 st. 2 — rok preuzimanja u danima. */
export const ROK_PREUZIMANJA_DANA = 15;

const DAN_MS = 24 * 60 * 60 * 1000;

/**
 * Nabavke čl. 44 st. 2 — rok preuzimanja teče od dana kada je hrana spremna, a za
 * vaučer uzet posle toga od uzimanja. Dok hrana nije spremna, rok ne teče (`null`).
 */
export function rokPreuzimanja(spremnoAt: Date | null, uzetoAt: Date): Date | null {
  if (!spremnoAt) return null;
  const od = uzetoAt.getTime() > spremnoAt.getTime() ? uzetoAt : spremnoAt;
  return new Date(od.getTime() + ROK_PREUZIMANJA_DANA * DAN_MS);
}

/** Nabavke čl. 41 st. 1 — doprinos gazdinstva pri predaji: vrednost × koeficijent. */
export function doprinosGazdinstvaPriPredaji(vrednost: number, koeficijent: number): number {
  return Math.round(vrednost * koeficijent);
}

/** Nabavke čl. 40 st. 3 — vrednost predatog: masa × cena po kg (STIPS ili cenovnik). */
export function vrednostPredatog(masaKg: number, cenaPoKg: number): number {
  return Math.round(masaKg * cenaPoKg * 100) / 100;
}

/** Nabavke čl. 42 st. 3 — doprinos za uslugu objekta: cenovnik × obim × koeficijent. */
export function doprinosUsluge(vrednostUsluge: number, koeficijent: number): number {
  return Math.round(vrednostUsluge * koeficijent);
}

/**
 * Nabavke čl. 46, Pravilnik čl. 17 st. 2 t. 9 (oblik B) — otpis pri preuzimanju
 * nepreuzetih delova od strane objekta.
 *
 * - Za deo čiji je vaučer uzet i istekao otpis se ne vrši (POEN je već poništen).
 * - Za deo za koji vaučer nije uzet otpisuje se broj POEN-a po vaučeru, najviše do
 *   visine doprinosa koji je licu za uslugu na toj partiji bio evidentiran, umanjenog
 *   za ono što mu je po ovom osnovu već otpisano; taj otpis sme u minus.
 * - Delove preko te granice objekat preuzima samo uz poništenje iz zapisa koji ima,
 *   bez negativnog zapisa.
 */
export function otpisZaNepreuzeteDelove(p: {
  delovaBezVaucera: number;
  poenaPoVauceru: number;
  doprinosZaUsluguNaPartiji: number;
  vecOtpisano: number;
  raspolozivo: number;
}): { otpis: number; ponistenje: number; delovaPreuzeto: number; delovaOstaje: number } {
  const c = Math.max(0, Math.trunc(p.poenaPoVauceru));
  let granica = Math.max(0, p.doprinosZaUsluguNaPartiji - p.vecOtpisano);
  let raspolozivo = Math.max(0, p.raspolozivo);
  let otpis = 0;
  let ponistenje = 0;
  let delovaPreuzeto = 0;
  const ukupno = Math.max(0, Math.trunc(p.delovaBezVaucera));
  for (let i = 0; i < ukupno; i++) {
    const izOtpisa = Math.min(c, granica);
    const izZapisa = c - izOtpisa;
    if (izZapisa > raspolozivo) break; // deo preko granice bez dovoljno POEN-a ostaje
    granica -= izOtpisa;
    raspolozivo -= izZapisa;
    otpis += izOtpisa;
    ponistenje += izZapisa;
    delovaPreuzeto++;
  }
  return { otpis, ponistenje, delovaPreuzeto, delovaOstaje: ukupno - delovaPreuzeto };
}
