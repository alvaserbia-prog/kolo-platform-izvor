/**
 * Pravilnik o operativnom doprinosu 5.0 — čista pravila postupka (bez Prisme).
 *
 * Celine (čl. 5, 6, 15) žive u `operativni-celine-pravila.ts`, izjava izvršioca
 * (čl. 10 st. 1 t. 3) u `operativni-izjava.ts`. Ovde je ono što akt traži od toka
 * zadatka: status (čl. 7), prijava i izmenjena prijava (čl. 9–12), lice koje
 * potvrđuje i sukob interesa (čl. 13), uslovna i završna potvrda (čl. 15, 16),
 * odustanak (čl. 17), primedba (čl. 18) i rokovi lica koje potvrđuje.
 *
 * 🔴 Rokovi iz akta nemaju posledicu po izvršioca: služe da lice koje potvrđuje
 * zna šta prvo rešava (red na ekranu potvrda). Ne pretvarati ih u automatsku
 * potvrdu ni u automatsko odbijanje — akt to ne kaže.
 */

// ── Rokovi (dani) ────────────────────────────────────────────────────────────

/** Čl. 12 st. 3 — izjašnjavanje o prijavi u zadatku sa odobravanjem. */
export const ROK_ODOBRAVANJA_DANA = 7;
/** Čl. 15 st. 1 — dokaz o izvršenju celina najkasnije 3 dana posle perioda. */
export const ROK_DOKAZA_DANA = 3;
/** Čl. 15 st. 2 — izjašnjavanje o izvršenju celina. */
export const ROK_CELINA_DANA = 3;
/** Čl. 16 st. 1 — izjašnjavanje o celokupnom izvršenju. */
export const ROK_ZAVRSNE_DANA = 7;
/** Čl. 18 st. 2 — izjašnjavanje o primedbi. */
export const ROK_PRIMEDBE_DANA = 7;

const DAN_MS = 24 * 60 * 60 * 1000;

/** Rok lica koje potvrđuje: `od` + broj dana. */
export function rokIzjasnjavanja(od: Date | string, dana: number): Date {
  return new Date(new Date(od).getTime() + dana * DAN_MS);
}

/** Da li je rok prošao (prikaz „kasni"; bez ikakvog dejstva). */
export function rokProsao(rok: Date | string, sada: Date = new Date()): boolean {
  return new Date(rok).getTime() < sada.getTime();
}

// ── Prijava i izvršilac ──────────────────────────────────────────────────────

export type PrijavaStanje = {
  status: string; // PENDING | APPROVED | REJECTED
  odustaoAt?: Date | string | null;
  zavrsnaOdluka?: string | null;
};

/** Ključ žive prijave (`OglasPrijava.aktivanKljuc`): jedna živa prijava po paru. */
export function kljucZivePrijave(oglasId: string, userId: string): string {
  return `${oglasId}:${userId}`;
}

/** Izvršilac koji zauzima mesto na zadatku (čl. 11 st. 2): primljen i nije odustao. */
export function zauzimaMesto(p: PrijavaStanje): boolean {
  return p.status === "APPROVED" && !p.odustaoAt;
}

/** Izvršilac koji još radi: zauzima mesto i o njegovom izvršenju nije završno odlučeno. */
export function radiNaZadatku(p: PrijavaStanje): boolean {
  return zauzimaMesto(p) && !p.zavrsnaOdluka;
}

/**
 * Čl. 12 st. 4 — posle odbijanja podnosilac sme da podnese izmenjenu prijavu za isti
 * zadatak; posle odustanka (čl. 17) zadatak je ponovo otvoren i za njega. Nova
 * prijava se odbija samo dok postoji živa (na čekanju ili primljena, bez odustanka).
 */
export function smeNovuPrijavu(ranije: readonly PrijavaStanje[]): boolean {
  return !ranije.some((p) => p.status === "PENDING" || zauzimaMesto(p));
}

// ── Status zadatka (čl. 7 st. 2) ─────────────────────────────────────────────

export type StatusZadatka = "OTVOREN" | "U_IZVRSENJU" | "IZVRSEN" | "NEIZVRSEN" | "POVUCEN";

/**
 * Status zadatka se izvodi, ne čuva: `DoprinosOglas.status` (ACTIVE/CLOSED/CANCELLED)
 * kaže da li zadatak traje, a prijave kažu šta se sa njim dešava.
 *  - povučen: CANCELLED (čl. 8);
 *  - izvršen / neizvršen: zatvoren zadatak, prema završnim odlukama (čl. 16);
 *  - u izvršenju: bar jedan izvršilac radi (čl. 11 st. 1);
 *  - otvoren: inače, i posle odustanka poslednjeg izvršioca (čl. 17 st. 2).
 */
export function statusZadatka(status: string, prijave: readonly PrijavaStanje[]): StatusZadatka {
  if (status === "CANCELLED") return "POVUCEN";
  if (status === "CLOSED") {
    return prijave.some((p) => p.zavrsnaOdluka === "IZVRSEN" || p.zavrsnaOdluka === "DELIMICNO")
      ? "IZVRSEN"
      : "NEIZVRSEN";
  }
  return prijave.some(radiNaZadatku) ? "U_IZVRSENJU" : "OTVOREN";
}

/**
 * Posle završne odluke zadatak se zatvara kad su sva mesta iskorišćena završnom
 * odlukom, ili kad niko više ne radi, a rok za prijavu je prošao.
 */
export function zatvaraSePoZavrsnoj(p: {
  pozicija: number;
  prijave: readonly PrijavaStanje[];
  rokZaPrijavu: Date | string | null;
  sada?: Date;
}): boolean {
  const zavrseno = p.prijave.filter((x) => zauzimaMesto(x) && x.zavrsnaOdluka).length;
  if (zavrseno >= p.pozicija) return true;
  const nikoNeRadi = !p.prijave.some(radiNaZadatku);
  return nikoNeRadi && p.rokZaPrijavu != null && rokProsao(p.rokZaPrijavu, p.sada);
}

// ── Elementi zadatka koji nisu celine (čl. 5, 9 st. 3, 12) ────────────────────

export const MIN_OBRAZLOZENJA = 10;

export type UnosZadatka = {
  obrazlozenje: unknown;
  deadline: unknown;
  rokIzvrsenja: unknown;
  kvalifikacioniUslov?: unknown;
  kvalifikacioniObrazlozenje?: unknown;
};

export type ProveraZadatka =
  | {
      ok: true;
      obrazlozenje: string;
      deadline: Date;
      rokIzvrsenja: Date;
      kvalifikacioniUslov: string | null;
      kvalifikacioniObrazlozenje: string | null;
    }
  | { ok: false; greska: string };

const tekst = (v: unknown) => (typeof v === "string" ? v.trim() : "");
function datum(v: unknown): Date | null {
  if (typeof v !== "string" && !(v instanceof Date)) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Čl. 5 t. 6–7 i 10 — obrazloženje predloženog POEN-a, rok za prijavu i rok za
 * izvršenje su obavezni; kvalifikacioni filter mora biti obrazložen (čl. 9 st. 3).
 */
export function proveriZadatak(u: UnosZadatka, sada: Date = new Date()): ProveraZadatka {
  const obrazlozenje = tekst(u.obrazlozenje);
  if (obrazlozenje.length < MIN_OBRAZLOZENJA)
    return { ok: false, greska: "Obrazloženje predloženog POEN-a je obavezno (čl. 5 t. 6)." };
  const deadline = datum(u.deadline);
  const rokIzvrsenja = datum(u.rokIzvrsenja);
  if (!deadline || !rokIzvrsenja)
    return { ok: false, greska: "Rok za prijavu i rok za izvršenje su obavezni (čl. 5 t. 7)." };
  if (deadline.getTime() < sada.getTime() - DAN_MS)
    return { ok: false, greska: "Rok za prijavu ne može biti u prošlosti." };
  if (rokIzvrsenja.getTime() < deadline.getTime())
    return { ok: false, greska: "Rok za izvršenje ne može biti pre roka za prijavu." };
  const uslov = tekst(u.kvalifikacioniUslov);
  const uslovObr = tekst(u.kvalifikacioniObrazlozenje);
  if (uslov && uslovObr.length < MIN_OBRAZLOZENJA)
    return { ok: false, greska: "Kvalifikacioni filter mora biti obrazložen (čl. 9 st. 3)." };
  return {
    ok: true,
    obrazlozenje,
    deadline,
    rokIzvrsenja,
    kvalifikacioniUslov: uslov || null,
    kvalifikacioniObrazlozenje: uslov ? uslovObr : null,
  };
}

/**
 * Čl. 12 st. 1 t. 3 — zadatak čiji predloženi POEN prelazi prag utvrđen odlukom UO
 * je zadatak sa odobravanjem. 🔴 Dok UO prag ne utvrdi (`null`), ovo pravilo nema
 * dejstva — prag se ne izmišlja.
 */
export function traziOdobravanjePoPragu(predlozeniPoen: number, prag: number | null): boolean {
  return prag != null && predlozeniPoen > prag;
}

// ── Lice koje potvrđuje (čl. 13) ─────────────────────────────────────────────

export type LiceKojePotvrdjuje = {
  id: string;
  /** Čuvar Kola ili osnivač (`jeCuvar`). */
  jeCuvar: boolean;
  /** Živo ovlašćenje UO (`OperativnoOvlascenje` bez opoziva). */
  ovlascenje: { izuzetakPredlagaca: boolean } | null;
};

/**
 * Čl. 13 st. 1 — izvršenje potvrđuju čuvari Kola i lice koje UO ovlasti. 🔴 Admin
 * nivo sam po sebi nije osnov: kolona `admin` je alat operative, ne ovlašćenje UO.
 * Čl. 23 st. 5 — zadružni doprinos potvrđuje SAMO čuvar Kola.
 */
export function smePotvrdjivati(l: LiceKojePotvrdjuje, zadruzni = false): boolean {
  if (zadruzni) return l.jeCuvar;
  return l.jeCuvar || l.ovlascenje != null;
}

/**
 * Čl. 13 st. 3–4 i čl. 23 st. 5 — sukob interesa. Vraća razlog ili `null`.
 *  - izvršilac istog zadatka nikad (bez izuzetka);
 *  - lice koje je zadatak objavilo ne, osim lica koje UO za to izričito ovlasti dok
 *    zadatke objavljuje Fondacija (st. 4) — 🔴 superadmin NIJE izuzet po nivou;
 *  - kod zadružnog doprinosa ni lice koje je celinu dodelilo ni lice koje radi u ime
 *    te zadruge.
 */
export function sukobInteresa(p: {
  licaId: string;
  izvrsilacId: string;
  predlagacId: string;
  izvorFondacija: boolean;
  izuzetakPredlagaca: boolean;
  zadruzni?: boolean;
  dodelioId?: string | null;
  radiUImeZadruge?: boolean;
}): string | null {
  if (p.licaId === p.izvrsilacId) return "Ne možeš odlučivati o sopstvenoj prijavi ni sopstvenom izvršenju (čl. 13 st. 3).";
  if (p.zadruzni) {
    if (p.dodelioId && p.licaId === p.dodelioId) return "Lice koje je celinu dodelilo ne potvrđuje njeno izvršenje (čl. 23 st. 5).";
    if (p.radiUImeZadruge) return "Lice koje radi u ime zadruge ne potvrđuje zadružni doprinos (čl. 23 st. 5).";
  }
  if (p.licaId === p.predlagacId && !(p.izvorFondacija && p.izuzetakPredlagaca && !p.zadruzni))
    return "Lice koje je zadatak objavilo ne potvrđuje na njemu (čl. 13 st. 4).";
  return null;
}

// ── Izjašnjavanje o celinama (čl. 15 st. 2) ──────────────────────────────────

export type OdlukaOCelinama = "POTVRDI" | "ODBIJ" | "DOPUNA";

/** Odbijanje i uslovna potvrda traže obrazloženje, odnosno opis tražene dopune. */
export function proveriOdlukuOCelinama(odluka: unknown, obrazlozenje: unknown):
  | { ok: true; odluka: OdlukaOCelinama; obrazlozenje: string | null }
  | { ok: false; greska: string } {
  if (odluka !== "POTVRDI" && odluka !== "ODBIJ" && odluka !== "DOPUNA") return { ok: false, greska: "Nepoznata odluka." };
  const o = tekst(obrazlozenje);
  if (odluka !== "POTVRDI" && o.length < MIN_OBRAZLOZENJA)
    return {
      ok: false,
      greska: odluka === "ODBIJ" ? "Odbijanje mora biti obrazloženo (čl. 15 st. 2 t. 2)." : "Navedi koju dopunu dokaza tražiš (čl. 15 st. 2 t. 3).",
    };
  return { ok: true, odluka, obrazlozenje: o || null };
}

// ── Završna potvrda (čl. 16) ─────────────────────────────────────────────────

export type ProveraZavrsne =
  | { ok: true; odluka: "IZVRSEN" | "DELIMICNO" | "ODBIJEN"; obrazlozenje: string | null; novihCelina: number }
  | { ok: false; greska: string };

/**
 * Čl. 16 st. 2 — izvršen: celine koje do tada nisu potvrđene ulaze u raspodelu
 * perioda završne potvrde; delimično: lice koje potvrđuje navodi koliko je još
 * celina izvršeno (srazmerna raspodela); odbijeno: uz obrazloženje, ništa novo.
 *
 * `prijavljeneCeline` su celine koje izvršilac već nosi (bez odbijenih), pa
 * `brojCelina − prijavljeneCeline` nikad nije prijavljeno ni potvrđeno.
 * Zatečeni zadatak bez celina (`brojCelina = null`) nema nove celine.
 */
export function proveriZavrsnu(p: {
  odluka: unknown;
  obrazlozenje: unknown;
  celine?: unknown;
  brojCelina: number | null;
  prijavljeneCeline: number;
}): ProveraZavrsne {
  const o = tekst(p.obrazlozenje);
  const preostalo = p.brojCelina == null ? 0 : Math.max(0, p.brojCelina - p.prijavljeneCeline);
  if (p.odluka === "IZVRSEN") return { ok: true, odluka: "IZVRSEN", obrazlozenje: o || null, novihCelina: preostalo };
  if (p.odluka === "ODBIJEN") {
    if (o.length < MIN_OBRAZLOZENJA) return { ok: false, greska: "Odbijanje završne potvrde mora biti obrazloženo (čl. 16 st. 2)." };
    return { ok: true, odluka: "ODBIJEN", obrazlozenje: o, novihCelina: 0 };
  }
  if (p.odluka === "DELIMICNO") {
    if (o.length < MIN_OBRAZLOZENJA) return { ok: false, greska: "Delimično izvršenje se obrazlaže (čl. 16 st. 2)." };
    const c = p.celine == null || p.celine === "" ? 0 : Number(p.celine);
    if (!Number.isInteger(c) || c < 0 || c > preostalo)
      return { ok: false, greska: `Broj dodatno izvršenih celina je ceo broj od 0 do ${preostalo}.` };
    return { ok: true, odluka: "DELIMICNO", obrazlozenje: o, novihCelina: c };
  }
  return { ok: false, greska: "Nepoznata odluka." };
}

// ── Primedba (čl. 18) ────────────────────────────────────────────────────────

export const PREDMETI_PRIMEDBE = ["PRIJAVA", "IZVRSENJE_CELINA", "ZAVRSNA"] as const;
export type PredmetPrimedbe = (typeof PREDMETI_PRIMEDBE)[number];
export const MAX_PRIMEDBE = 2000;

/** Primedba je obrazložena (st. 1) i podnosi se dok zadatak traje. */
export function proveriPrimedbu(p: { predmet: unknown; tekst: unknown; zadatakTraje: boolean }):
  | { ok: true; predmet: PredmetPrimedbe; tekst: string }
  | { ok: false; greska: string } {
  if (!p.zadatakTraje) return { ok: false, greska: "Primedba se podnosi dok zadatak traje (čl. 18 st. 1)." };
  if (typeof p.predmet !== "string" || !(PREDMETI_PRIMEDBE as readonly string[]).includes(p.predmet))
    return { ok: false, greska: "Izaberi na šta se primedba odnosi." };
  const t = tekst(p.tekst);
  if (t.length < MIN_OBRAZLOZENJA) return { ok: false, greska: "Primedba mora biti obrazložena (čl. 18 st. 1)." };
  if (t.length > MAX_PRIMEDBE) return { ok: false, greska: `Primedba može imati najviše ${MAX_PRIMEDBE} znakova.` };
  return { ok: true, predmet: p.predmet as PredmetPrimedbe, tekst: t };
}

// ── Parametri koje utvrđuje UO ───────────────────────────────────────────────

/** Ključevi `OdlukaParametra`. */
export const PARAMETAR_IZNOS_JEDINICE = "ZADRUZNI_IZNOS_JEDINICE";
export const PARAMETAR_PRAG_ODOBRAVANJA = "OPERATIVNI_PRAG_ODOBRAVANJA";
export const PARAMETRI_UO = [PARAMETAR_IZNOS_JEDINICE, PARAMETAR_PRAG_ODOBRAVANJA] as const;
export type ParametarUO = (typeof PARAMETRI_UO)[number];

/**
 * Vrednost parametra na dan `dan` (Date na UTC ponoći beogradskog dana): poslednja
 * odluka čiji je `vaziOd` taj dan ili raniji. 🔴 Bez odluke vraća `null` — nema
 * podrazumevane vrednosti.
 */
export function vazecaVrednost(
  odluke: readonly { kljuc: string; vrednost: number; vaziOd: Date; createdAt?: Date }[],
  kljuc: string,
  dan: Date,
): number | null {
  const vazece = odluke
    .filter((o) => o.kljuc === kljuc && o.vaziOd.getTime() <= dan.getTime())
    .sort((a, b) => a.vaziOd.getTime() - b.vaziOd.getTime() || (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  return vazece.length ? vazece[vazece.length - 1].vrednost : null;
}

/**
 * Od kog obračunskog perioda važi nova odluka. Iznos jedinice zadružnog doprinosa
 * važi od prvog narednog perioda (operativni čl. 23 st. 4); prag za odobravanje akt
 * ne odlaže, pa važi od dana upisa.
 */
export function vaziOdZa(kljuc: string, danas: Date): Date {
  if (kljuc === PARAMETAR_IZNOS_JEDINICE) return new Date(danas.getTime() + DAN_MS);
  return danas;
}
