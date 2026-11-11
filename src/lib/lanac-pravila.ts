/**
 * Program raspodele hrane i lanac proizvodnje i distribucije — ČISTA pravila (bez Prisme).
 *
 * Jedan motor: program raspodele hrane (Pravilnik o projektima i kolektivnim nabavkama,
 * Glava X, čl. 38–47) je lanac sa dve karike — gazdinstvo → objekat — uređen Glavom X;
 * lanac (Glava XI, čl. 48–52) ima davaoca sirovine i niz partnera po odluci o lancu.
 * Glava XI se na program primenjuje samo kada Glava X pitanje ne uređuje (čl. 48 st. 3).
 *
 * Izvor: nabavke čl. 39–52; Pravilnik o pokroviteljstvu i donacijama čl. 22 st. 4–8 (koeficijent
 * hrane), Glava VI (partnerstvo); Pravilnik o KOLO sistemu čl. 17 st. 2 t. 9 (deveti osnov),
 * čl. 18 (poništenje po iskorišćenju), čl. 37 st. 4 i čl. 39 st. 5 (kanali).
 *
 * Servis: `src/lib/protokol/lanac.ts` (re-eksportuje ovaj fajl).
 *
 * 🔴 Broj POEN-a po vaučeru izvodi se iz zbira evidentiranih doprinosa (čl. 43 st. 2, čl. 52 st. 1):
 *    nije cena, uz njega se nikad ne prikazuje dinarska vrednost i nigde ne piše 1:1 (R-01).
 * 🔴 Deveti osnov negativnog zapisa (Pravilnik čl. 17 st. 2 t. 9, set 5.1.4) važi SAMO za deo
 *    bez uzetog vaučera: u programu najviše do doprinosa za uslugu objekta na toj partiji
 *    (čl. 46 st. 2), u lancu najviše do doprinosa poslednjeg partnera po tom lancu — usluga i
 *    dodatak za distribuciju (čl. 52 st. 4). Nepreuzete delove po isteku roka PREUZIMA objekat,
 *    odnosno poslednji partner — automatski, bez mogućnosti odbijanja; Fondacija predaje samo
 *    ostatak koji ni uz poništenje iz zapisa nije mogao biti preuzet (čl. 46 st. 4, čl. 52 st. 6).
 *    Trinaesti osnov se ne uvodi.
 * 🔴 Ugovori ne sadrže broj POEN-a ni koeficijent evidencije (čl. 40 st. 4; donacije čl. 31 st. 3).
 */
import {
  ROK_PREUZIMANJA_DANA,
  rokPreuzimanja,
  vrednostPredatog,
  doprinosGazdinstvaPriPredaji,
  doprinosUsluge,
  otpisZaNepreuzeteDelove,
  procitajOdgovoreHrane,
  koeficijentIzOdgovora,
  jeVrstaHrane,
  type OdgovoriHrane,
  type Kategorija,
  type VrstaHrane,
} from "@/lib/hrana-pravila";
import { MAX_AKTIVNIH_VAUCERA_PO_CLANU, HRANA_U_UGOVORU, ocistiBpgDavaoca, normalizujKod } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { FONDACIJA } from "@/lib/donacija-ugovor";
import { koordinateZaMesto, udaljenostKm } from "@/lib/udaljenost";

export { ROK_PREUZIMANJA_DANA, rokPreuzimanja, vrednostPredatog, normalizujKod };

// ─── Konstante ────────────────────────────────────────────────────────────────

export type VrstaLanca = "PROGRAM_HRANE" | "LANAC";
export type UlogaKarike = "DAVALAC_SIROVINE" | "PARTNER" | "POSLEDNJI";
export type OrganOdluke = "UPRAVNI_ODBOR" | "GORNJE_KOLO";

/** Nabavke čl. 40 st. 1: u programu se predaje stoka, odnosno mleko. */
export const VRSTE_HRANE_PROGRAMA: readonly VrstaHrane[] = ["MESO", "MLEKO"];

/**
 * Nabavke čl. 43 st. 3: najviše dva neiskorišćena vaučera UKUPNO — vaučeri programa i lanca
 * zajedno sa vaučerima iz pokroviteljstva dobrima i uslugama (čl. 30 st. 2). Ista konstanta.
 */
export const MAX_AKTIVNIH_VAUCERA_UKUPNO = MAX_AKTIVNIH_VAUCERA_PO_CLANU;

/** Nabavke čl. 43 st. 3: iz iste partije najviše jedan neiskorišćen vaučer. */
export const MAX_AKTIVNIH_IZ_PARTIJE = 1;

/** Tehnička granica broja vaučera po partiji, odnosno lancu. */
export const MAX_VAUCERA_PO_PARTIJI = 5000;

/** Nabavke čl. 49 t. 2: za sirovinu koja nije hrana koeficijent je od 1,00 do 2,00. */
export const MIN_KOEFICIJENT_SIROVINE = 1.0;
export const MAX_KOEFICIJENT_SIROVINE = 2.0;

/** Nabavke čl. 51 st. 1: usluga partnera u lancu evidentira se sa koeficijentom 1,00. */
export const KOEFICIJENT_PARTNERA = 1.0;

/** Dodatak za distribuciju (čl. 49 t. 7) je procenat vrednosti izdate robe — tehnička granica. */
export const MAX_DODATAK_PCT = 100;

const DAN_MS = 24 * 60 * 60 * 1000;

// ─── Organ odluke o lancu (čl. 48 st. 2) ──────────────────────────────────────

/** U Fazi 1 odluku o lancu donosi Upravni odbor, u Fazi 2 Gornje Kolo. */
export function organZaFazu(faza: "FAZA_1" | "FAZA_2"): OrganOdluke {
  return faza === "FAZA_2" ? "GORNJE_KOLO" : "UPRAVNI_ODBOR";
}

// ─── Iznosi (mera obima doprinosa, čl. 51 st. 2) ──────────────────────────────

const dveDecimale = (n: number) => Math.round(n * 100) / 100;

/** Vrednost usluge: cena iz cenovnika × obim (čl. 42 st. 3, čl. 49 t. 5). */
export function vrednostUsluge(cenaPoJedinici: number, obim: number): number {
  if (!(cenaPoJedinici > 0) || !(obim > 0)) return 0;
  return dveDecimale(cenaPoJedinici * obim);
}

/** Doprinos davaoca sirovine: vrednost × koeficijent (čl. 41 st. 1, čl. 51 st. 1). */
export function doprinosSirovine(vrednost: number, koeficijent: number): number {
  return doprinosGazdinstvaPriPredaji(vrednost, koeficijent);
}

/** Program: doprinos za uslugu objekta = vrednost usluge × koeficijent hrane (čl. 42 st. 3). */
export function doprinosUslugeObjekta(vrednost: number, koeficijentHrane: number): number {
  return doprinosUsluge(vrednost, koeficijentHrane);
}

/** Lanac: doprinos partnera = vrednost usluge × 1,00 (čl. 51 st. 1). */
export function doprinosUslugePartnera(vrednost: number): number {
  return Math.round(vrednost * KOEFICIJENT_PARTNERA);
}

/** Vrednost robe u lancu: vrednost sirovine i vrednosti usluga partnera. */
export function vrednostRobe(vrednostSirovine: number, vrednostiUsluga: readonly number[]): number {
  return dveDecimale(vrednostSirovine + vrednostiUsluga.reduce((a, b) => a + b, 0));
}

/**
 * Dodatak za distribuciju (čl. 49 t. 7, čl. 51 st. 1): procenat vrednosti IZDATE robe. Vrednost
 * izdate robe je srazmerni deo vrednosti robe lanca — `izdato` od `brojVaucera` delova.
 */
export function dodatakZaIzdato(vrednostRobeLanca: number, brojVaucera: number, izdato: number, procenat: number): number {
  if (!Number.isInteger(brojVaucera) || brojVaucera < 1 || !(izdato > 0) || !(procenat > 0)) return 0;
  const deo = Math.min(izdato, brojVaucera) / brojVaucera;
  return Math.round((vrednostRobeLanca * deo * procenat) / 100);
}

/**
 * Broj POEN-a po vaučeru (čl. 43 st. 2, čl. 52 st. 1): zbir doprinosa koji se za partiju,
 * odnosno lanac evidentiraju, podeljen brojem vaučera, zaokružen na najbliži ceo broj.
 */
export function poenaPoVauceruIzDoprinosa(doprinosi: readonly number[], brojVaucera: number): number {
  if (!Number.isInteger(brojVaucera) || brojVaucera < 1) return 0;
  const zbir = doprinosi.reduce((a, b) => a + Math.max(0, Math.trunc(b)), 0);
  return Math.round(zbir / brojVaucera);
}

/**
 * Program (čl. 41–43): doprinos gazdinstva pri predaji i doprinos za uslugu objekta (obim
 * usluge naveden u zapisniku), i iz njih broj POEN-a po vaučeru. Objekat dobija upis tek po
 * izvršenju usluge, ali ISTIM brojem — obim se posle zapisnika ne menja.
 */
export function planProgramaHrane(p: {
  vrednostPredatog: number;
  koeficijentHrane: number;
  vrednostUslugeObjekta: number;
  brojVaucera: number;
}): { gazdinstvo: number; objekat: number; poenaPoVauceru: number } {
  const gazdinstvo = doprinosSirovine(p.vrednostPredatog, p.koeficijentHrane);
  const objekat = doprinosUslugeObjekta(p.vrednostUslugeObjekta, p.koeficijentHrane);
  return { gazdinstvo, objekat, poenaPoVauceru: poenaPoVauceruIzDoprinosa([gazdinstvo, objekat], p.brojVaucera) };
}

/**
 * Lanac (čl. 51–52): doprinos davaoca sirovine, partnera (vrednost usluge iz odluke × 1,00) i
 * dodatak za distribuciju za ceo broj vaučera; iz njih broj POEN-a po vaučeru. Dodatak se beleži
 * tek kad Fondacija utvrdi da je roba izdata, srazmerno izdatom delu.
 */
export function planLanca(p: {
  vrednostSirovine: number;
  koeficijentSirovine: number;
  vrednostiUsluga: readonly number[];
  dodatakPct: number;
  brojVaucera: number;
}): { sirovina: number; usluge: number[]; dodatak: number; poenaPoVauceru: number } {
  const sirovina = doprinosSirovine(p.vrednostSirovine, p.koeficijentSirovine);
  const usluge = p.vrednostiUsluga.map(doprinosUslugePartnera);
  const dodatak = dodatakZaIzdato(vrednostRobe(p.vrednostSirovine, p.vrednostiUsluga), p.brojVaucera, p.brojVaucera, p.dodatakPct);
  return { sirovina, usluge, dodatak, poenaPoVauceru: poenaPoVauceruIzDoprinosa([sirovina, ...usluge, dodatak], p.brojVaucera) };
}

// ─── Rokovi (čl. 44) ──────────────────────────────────────────────────────────

/**
 * Vaučer partije se može uzeti dok su vaučeri izdati, partija nije prestala i dok traje rok od
 * 15 dana od dana kada je hrana spremna (čl. 44 st. 2). Posle toga deo bez uzetog vaučera je
 * nepreuzet (čl. 46).
 */
export function uzimanjeOtvoreno(
  l: { status: string; neispravnoAt: Date | null; spremnoAt: Date | null },
  sada: Date,
): boolean {
  if (l.status !== "VAUCERI_IZDATI" || l.neispravnoAt) return false;
  if (!l.spremnoAt) return true;
  return sada.getTime() < l.spremnoAt.getTime() + ROK_PREUZIMANJA_DANA * DAN_MS;
}

/** Po isteku roka objekat sme da preuzme delove bez uzetog vaučera (čl. 46 st. 1). */
export function rokZaNepreuzeteIstekao(spremnoAt: Date | null, sada: Date): boolean {
  return !!spremnoAt && sada.getTime() >= spremnoAt.getTime() + ROK_PREUZIMANJA_DANA * DAN_MS;
}

/** Uzet vaučer je istekao kad je hrana spremna, a rok preuzimanja (čl. 44 st. 2) je prošao. */
export function vaucerIstekao(spremnoAt: Date | null, dodeljenAt: Date | null, sada: Date): boolean {
  if (!spremnoAt || !dodeljenAt) return false;
  const rok = rokPreuzimanja(spremnoAt, dodeljenAt);
  return !!rok && sada.getTime() >= rok.getTime();
}

// ─── Uzimanje vaučera (čl. 43 st. 3–4, shodno čl. 33) ─────────────────────────

export type IshodProvere = { ok: true } | { ok: false; razlog: string };

/**
 * Sme li korisnik da uzme vaučer partije, odnosno lanca:
 *  - punoletni korisnik sa aktivnim nalogom (čl. 43 st. 3) — potvrda stvarnosti se NE traži
 *    (Uslovi čl. 14 st. 4: korisnik koji nije u Kolu učestvuje u programu raspodele hrane);
 *  - nije karika te partije, odnosno lanca (shodno čl. 33 st. 1 i donacije čl. 36);
 *  - dao je izjavu i pristanak na prikaz zapisa uz pseudonim (shodno čl. 33 st. 1);
 *  - nema već dva neiskorišćena vaučera, računajući i vaučere pokroviteljstva dobrima;
 *  - nema već neiskorišćen vaučer iz iste partije;
 *  - ima dovoljno raspoloživih POEN-a — zapis ne ide u minus.
 */
export function smeUzetiVaucerLanca(u: {
  maloletan: boolean;
  status: string;
  deaktiviranAt: Date | null;
  jeKarika: boolean;
  izjavaNepovezan: boolean;
  pristanakPrikaz: boolean;
  aktivnihUkupno: number;
  aktivnihIzPartije: number;
  raspolozivo: number;
  poenaPoVauceru: number;
}): IshodProvere {
  if (u.maloletan) return { ok: false, razlog: "Maloletni korisnik ne uzima vaučer programa." };
  if (u.deaktiviranAt || u.status !== "ACTIVE") return { ok: false, razlog: "Vaučer uzima korisnik sa aktivnim nalogom." };
  if (u.jeKarika) return { ok: false, razlog: "Ko učestvuje u partiji ne uzima njene vaučere." };
  if (!u.izjavaNepovezan) return { ok: false, razlog: "Potrebna je izjava da ne učestvuješ u ovoj partiji." };
  if (!u.pristanakPrikaz) return { ok: false, razlog: "Bez pristanka na prikaz zapisa uz pseudonim vaučer se ne može uzeti." };
  if (u.aktivnihUkupno >= MAX_AKTIVNIH_VAUCERA_UKUPNO)
    return { ok: false, razlog: "Istovremeno možeš imati najviše dva neiskorišćena vaučera." };
  if (u.aktivnihIzPartije >= MAX_AKTIVNIH_IZ_PARTIJE)
    return { ok: false, razlog: "Iz ove partije već imaš neiskorišćen vaučer." };
  if (!(u.poenaPoVauceru > 0) || u.raspolozivo < u.poenaPoVauceru) return { ok: false, razlog: "Nemaš dovoljno POEN-a za ovaj vaučer." };
  return { ok: true };
}

// ─── Stanje vaučera za objekat (čl. 44 st. 2) ─────────────────────────────────

export type StanjeVauceraLanca = "VAZI" | "NIJE_SPREMNO" | "ISKORISCEN" | "ISTEKAO" | "NE_VAZI" | "NEPOZNAT";

/** Šta objekat, odnosno poslednji partner vidi kad unese kod (uz opis i pseudonim imaoca). */
export function stanjeVauceraLanca(v: {
  status: string;
  spremnoAt: Date | null;
  dodeljenAt: Date | null;
  sada: Date;
}): StanjeVauceraLanca {
  if (v.status === "ISKORISCEN") return "ISKORISCEN";
  if (v.status === "ISTEKAO") return "ISTEKAO";
  if (v.status !== "DODELJEN") return "NE_VAZI";
  if (!v.spremnoAt) return "NIJE_SPREMNO";
  return vaucerIstekao(v.spremnoAt, v.dodeljenAt, v.sada) ? "ISTEKAO" : "VAZI";
}

// ─── Zamena (čl. 45) ──────────────────────────────────────────────────────────

/**
 * Kada hrana nije ispravna, vaučer se prenosi na drugu partiju iste vrste: prva partija (po
 * redu ponude) koja ima slobodan vaučer i u kojoj imalac još nema neiskorišćen vaučer.
 * `null` = takve partije nema — vaučer prestaje, a poništenje se ispravlja.
 */
export function partijaZaZamenu(
  kandidati: readonly { lanacId: string; slobodnih: number; imalacVecIma: boolean }[],
): string | null {
  for (const k of kandidati) if (k.slobodnih > 0 && !k.imalacVecIma) return k.lanacId;
  return null;
}

// ─── Nepreuzeti delovi (čl. 46; Pravilnik čl. 17 st. 2 t. 9) ──────────────────

/**
 * Otpis i poništenje kada objekat posle roka preuzme delove za koje vaučer NIJE uzet.
 * Za deo čiji je vaučer uzet i istekao otpisa nema (ne ulazi u `delovaBezVaucera`).
 *
 * Kada je objekat zadruga, doprinos je evidentiran u zapisu zadruge, a zapis zadruge ne ide u
 * minus — deveti osnov se ne primenjuje (granica 0), pa se deo preuzima samo uz poništenje iz
 * zapisa koji zadruga ima (najkonzervativnije tumačenje).
 */
export function otpisNepreuzetihDelova(p: {
  delovaBezVaucera: number;
  poenaPoVauceru: number;
  doprinosZaUsluguNaPartiji: number;
  vecOtpisano: number;
  raspolozivo: number;
  zapisZadruge: boolean;
}): { otpis: number; ponistenje: number; delovaPreuzeto: number; delovaOstaje: number } {
  const doprinos = p.zapisZadruge ? 0 : p.doprinosZaUsluguNaPartiji;
  // Poništenje preko granice ide „iz zapisa koji ima, bez negativnog zapisa": raspoloživo za
  // njega je ono što ostaje posle otpisa. Otpis troši celu granicu kad god je poništenje
  // potrebno, pa je umanjenje za granicu (najviše za ukupan broj POEN-a delova) tačno.
  const granica = Math.max(0, doprinos - p.vecOtpisano);
  const delova = Math.max(0, Math.trunc(p.delovaBezVaucera));
  const potrosenoOtpisom = Math.min(granica, delova * Math.max(0, Math.trunc(p.poenaPoVauceru)));
  return otpisZaNepreuzeteDelove({
    delovaBezVaucera: p.delovaBezVaucera,
    poenaPoVauceru: p.poenaPoVauceru,
    doprinosZaUsluguNaPartiji: doprinos,
    vecOtpisano: p.vecOtpisano,
    raspolozivo: Math.max(0, p.raspolozivo - potrosenoOtpisom),
  });
}

/**
 * Preuzimanje nepreuzetih delova po isteku roka — program (čl. 46, objekat) i lanac (čl. 52
 * st. 3–6, poslednji partner); JEDNA funkcija za oba, obmotava `otpisNepreuzetihDelova`.
 *
 * Za deo bez uzetog vaučera pokriva se broj POEN-a po vaučeru, redom:
 *  1) iz ZABELEŽENOG, a još neevidentiranog doprinosa tog lica po toj partiji, odnosno lancu
 *     (lanac: usluga i dodatak za distribuciju koji čekaju naredni obračunski period) — taj
 *     deo se samo poništava, bez transakcije, jer POEN još nije u zapisu (tumačenje uz odluku
 *     vlasnika 10.11.2026: doprinos koji bi tek bio evidentiran ne evidentira se, umesto da
 *     se prvo evidentira pa otpiše);
 *  2) otpisom iz EVIDENTIRANOG doprinosa, umanjenog za već otpisano — deveti osnov, SME u minus;
 *  3) preko te granice poništenjem iz zapisa koji lice ima, BEZ minusa; deo koji se ni tako ne
 *     pokrije ostaje (Fondacija ga predaje po čl. 46 st. 4, odnosno čl. 52 st. 6).
 * Zapis zadruge ne ide u minus: korak 2 je za njega nula.
 */
export function preuzimanjeNepreuzetihDelova(p: {
  delovaBezVaucera: number;
  poenaPoVauceru: number;
  zabelezeno: number;
  evidentirano: number;
  vecOtpisano: number;
  raspolozivo: number;
  zapisZadruge: boolean;
}): {
  zabelezenoPonisteno: number;
  otpis: number;
  ponistenje: number;
  delovaPreuzeto: number;
  delovaOstaje: number;
  poDelu: { zabelezeno: number; otpis: number }[];
} {
  const c = Math.max(0, Math.trunc(p.poenaPoVauceru));
  const delova = Math.max(0, Math.trunc(p.delovaBezVaucera));
  const z = Math.max(0, Math.trunc(p.zabelezeno));
  const e = p.zapisZadruge ? 0 : Math.max(0, p.evidentirano - p.vecOtpisano);
  // Zabeleženo se troši pre otpisa i ne dira stanje, pa se raspoloživom vraća onoliko koliko
  // unutrašnja funkcija pripiše „otpisu" a zapravo je pokriveno iz zabeleženog.
  const izZabelezenog = Math.min(z, delova * c);
  const o = otpisNepreuzetihDelova({
    delovaBezVaucera: delova,
    poenaPoVauceru: c,
    doprinosZaUsluguNaPartiji: z + e,
    vecOtpisano: 0,
    raspolozivo: p.raspolozivo + izZabelezenog,
    zapisZadruge: false,
  });
  const zabelezenoPonisteno = Math.min(z, o.otpis);
  const otpis = o.otpis - zabelezenoPonisteno;
  const slobodno = rasporediOtpis(o.otpis, o.delovaPreuzeto, c);
  let ostZ = zabelezenoPonisteno;
  const poDelu = slobodno.map((x) => {
    const iz = Math.min(ostZ, x);
    ostZ -= iz;
    return { zabelezeno: iz, otpis: x - iz };
  });
  return { zabelezenoPonisteno, otpis, ponistenje: o.ponistenje, delovaPreuzeto: o.delovaPreuzeto, delovaOstaje: o.delovaOstaje, poDelu };
}

/** Raspodela ukupnog otpisa po delovima (redom, svaki deo najviše broj POEN-a po vaučeru). */
export function rasporediOtpis(ukupno: number, delova: number, poenaPoVauceru: number): number[] {
  const out: number[] = [];
  let ostalo = Math.max(0, ukupno);
  for (let i = 0; i < delova; i++) {
    const d = Math.min(ostalo, Math.max(0, poenaPoVauceru));
    out.push(d);
    ostalo -= d;
  }
  return out;
}

// ─── Izbor najbližeg objekta (čl. 39 st. 3) ───────────────────────────────────

/**
 * Za partiju se bira najbliži objekat koji je može primiti. Platforma predlaže redosled po
 * udaljenosti od mesta gazdinstva (koordinate naselja iz šifarnika); objekti bez poznatih
 * koordinata idu na kraj. Da li objekat partiju može primiti utvrđuje Fondacija.
 */
export function objektiPoUdaljenosti<T extends { mesto: string }>(
  mestoGazdinstva: string,
  objekti: readonly T[],
): (T & { km: number | null })[] {
  const a = koordinateZaMesto(mestoGazdinstva);
  return objekti
    .map((o) => {
      const b = koordinateZaMesto(o.mesto);
      return { ...o, km: a && b ? Math.round(udaljenostKm(a, b) * 10) / 10 : null };
    })
    .sort((x, y) => (x.km ?? Infinity) - (y.km ?? Infinity));
}

// ─── Unos (ručna validacija, bez zod-a) ───────────────────────────────────────

const tekst = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const broj = (v: unknown) => (v === "" || v == null ? NaN : Number(v));
const daJe = (v: unknown) => v === true || v === "true";

export type UnosPoziva = { naziv: string; opis: string; uslovi: string; rokObradeDana: number };

/** Javni poziv (čl. 39 st. 1–2): naziv, opis, uslovi čuvanja i rok obrade. */
export function procitajPoziv(b: Record<string, unknown>): { ok: true; poziv: UnosPoziva } | { ok: false; razlog: string } {
  const naziv = tekst(b.naziv, 150);
  const opis = typeof b.opis === "string" ? b.opis.trim().slice(0, 4000) : "";
  const uslovi = typeof b.uslovi === "string" ? b.uslovi.trim().slice(0, 4000) : "";
  const rok = broj(b.rokObradeDana);
  if (naziv.length < 5) return { ok: false, razlog: "Upiši naziv poziva." };
  if (opis.length < 20) return { ok: false, razlog: "Upiši opis poziva." };
  if (uslovi.length < 10) return { ok: false, razlog: "Upiši uslove za čuvanje i rok obrade." };
  if (!Number.isInteger(rok) || rok < 1 || rok > 365) return { ok: false, razlog: "Rok obrade je ceo broj dana, od 1 do 365." };
  return { ok: true, poziv: { naziv, opis, uslovi, rokObradeDana: rok } };
}

export type UnosPrijaveGazdinstva = {
  naziv: string;
  bpg: string;
  adresa: string | null;
  odgovori: OdgovoriHrane;
  kategorija: Kategorija;
  koeficijent: number;
  cenovnikCena: number | null;
  cenovnikUrl: string | null;
};

/**
 * Prijava gazdinstva (čl. 39 st. 2, čl. 40 st. 1): gazdinstvo iz RPG-a (broj gazdinstva od 12
 * cifara), stoka odnosno mleko, podaci o proizvodnji iz kojih se izvodi poreklo (donacije čl. 22
 * st. 5) i cena iz cenovnika gazdinstva za slučaj da STIPS cene nema (čl. 40 st. 3).
 */
export function procitajPrijavuGazdinstva(
  b: Record<string, unknown>,
): { ok: true; prijava: UnosPrijaveGazdinstva } | { ok: false; razlog: string } {
  const naziv = tekst(b.naziv, 150);
  if (naziv.length < 2) return { ok: false, razlog: "Upiši naziv gazdinstva." };
  const bpg = ocistiBpgDavaoca(b.bpg);
  if (!bpg) return { ok: false, razlog: "Upiši broj gazdinstva iz Registra poljoprivrednih gazdinstava (12 cifara)." };
  if (!jeVrstaHrane(b.vrstaHrane) || !VRSTE_HRANE_PROGRAMA.includes(b.vrstaHrane))
    return { ok: false, razlog: "U programu se predaje stoka, odnosno mleko." };
  const o = procitajOdgovoreHrane(b);
  if (!o.ok) return o;
  const { kategorija, koeficijent } = koeficijentIzOdgovora(o.odgovori);
  const cena = broj(b.cenovnikCena);
  const cenovnikCena = Number.isFinite(cena) && cena > 0 ? dveDecimale(cena) : null;
  const url = tekst(b.cenovnikUrl, 500);
  if (!daJe(b.izjava)) return { ok: false, razlog: "Potrebna je izjava o tačnosti podataka i o obeleženim životinjama." };
  return {
    ok: true,
    prijava: {
      naziv, bpg, adresa: tekst(b.adresa, 200) || null, odgovori: o.odgovori, kategorija, koeficijent, cenovnikCena,
      cenovnikUrl: /^https:\/\//.test(url) ? url : null,
    },
  };
}

export type UnosPrijaveObjekta = {
  naziv: string;
  brojOdobrenja: string;
  adresa: string;
  uslugaOpis: string;
  uslugaJedinica: string;
  uslugaCena: number;
  cenovnikUrl: string | null;
};

/**
 * Prijava objekta (čl. 39 st. 2, čl. 42): objekat upisan, odnosno odobren za tu delatnost po
 * propisima o bezbednosti hrane, i usluga iz sopstvenog cenovnika (cena po jedinici). Fondacija
 * cenu ne procenjuje.
 */
export function procitajPrijavuObjekta(
  b: Record<string, unknown>,
): { ok: true; prijava: UnosPrijaveObjekta } | { ok: false; razlog: string } {
  const naziv = tekst(b.naziv, 150);
  const brojOdobrenja = tekst(b.brojOdobrenja, 60);
  const adresa = tekst(b.adresa, 200);
  const uslugaOpis = tekst(b.uslugaOpis, 300);
  const uslugaJedinica = tekst(b.uslugaJedinica, 30);
  const cena = broj(b.uslugaCena);
  if (naziv.length < 2) return { ok: false, razlog: "Upiši naziv objekta." };
  if (brojOdobrenja.length < 2) return { ok: false, razlog: "Upiši broj upisa, odnosno odobrenja objekta." };
  if (adresa.length < 3) return { ok: false, razlog: "Upiši adresu objekta." };
  if (uslugaOpis.length < 5) return { ok: false, razlog: "Opiši uslugu (obrada, čuvanje, izdavanje)." };
  if (uslugaJedinica.length < 1) return { ok: false, razlog: "Upiši jedinicu usluge (npr. kg, grlo)." };
  if (!Number.isFinite(cena) || cena <= 0) return { ok: false, razlog: "Upiši cenu usluge po jedinici iz cenovnika." };
  if (!daJe(b.izjava)) return { ok: false, razlog: "Potrebna je izjava da je objekat upisan, odnosno odobren i da ima uslove iz poziva." };
  const url = tekst(b.cenovnikUrl, 500);
  return {
    ok: true,
    prijava: { naziv, brojOdobrenja, adresa, uslugaOpis, uslugaJedinica, uslugaCena: dveDecimale(cena), cenovnikUrl: /^https:\/\//.test(url) ? url : null },
  };
}

export type UnosPartije = {
  naziv: string;
  brojVaucera: number;
  kolicinaPoVauceru: string;
  stipsKategorija: string | null;
  jedinica: string;
};

/** Partija programa (čl. 43 st. 1): opis, broj vaučera na jednake količine, STIPS kategorija. */
export function procitajPartiju(b: Record<string, unknown>): { ok: true; partija: UnosPartije } | { ok: false; razlog: string } {
  const naziv = tekst(b.naziv, 150);
  const brojV = broj(b.brojVaucera);
  const kolicina = tekst(b.kolicinaPoVauceru, 60);
  const stips = tekst(b.stipsKategorija, 120);
  const jedinica = tekst(b.jedinica, 20) || "kg";
  if (naziv.length < 3) return { ok: false, razlog: "Upiši opis partije." };
  if (!Number.isInteger(brojV) || brojV < 1 || brojV > MAX_VAUCERA_PO_PARTIJI)
    return { ok: false, razlog: "Broj vaučera je ceo broj veći od nule." };
  if (kolicina.length < 1) return { ok: false, razlog: "Upiši količinu hrane po vaučeru." };
  return { ok: true, partija: { naziv, brojVaucera: brojV, kolicinaPoVauceru: kolicina, stipsKategorija: stips || null, jedinica } };
}

export type UnosZapisnika = { kolicina: number; oznakeZivotinja: string | null; obimUsluge: number | null };

/**
 * Zapisnik o primopredaji (čl. 40 st. 2, čl. 50 st. 2): masa sa vage, uz oznake životinja kad se
 * predaje stoka; u programu i obim usluge objekta na partiji (čl. 42 st. 3).
 */
export function procitajZapisnik(
  b: Record<string, unknown>,
  p: { traziOznake: boolean; traziObim: boolean },
): { ok: true; zapisnik: UnosZapisnika } | { ok: false; razlog: string } {
  const kolicina = broj(b.kolicina);
  if (!Number.isFinite(kolicina) || kolicina <= 0 || kolicina > 1_000_000) return { ok: false, razlog: "Upiši masu sa vage, odnosno količinu." };
  const oznake = tekst(b.oznakeZivotinja, 1000);
  if (p.traziOznake && oznake.length < 2) return { ok: false, razlog: "Upiši oznake životinja (ušni brojevi)." };
  let obimUsluge: number | null = null;
  if (p.traziObim) {
    const o = broj(b.obimUsluge);
    if (!Number.isFinite(o) || o <= 0) return { ok: false, razlog: "Upiši obim usluge objekta na partiji." };
    obimUsluge = dveDecimale(o);
  }
  return { ok: true, zapisnik: { kolicina: Math.round(kolicina * 1000) / 1000, oznakeZivotinja: oznake || null, obimUsluge } };
}

export type UnosKarikeLanca = {
  uloga: UlogaKarike;
  pseudonim: string;
  naziv: string;
  mestoPredaje: string;
  adresaPredaje: string | null;
  uslugaOpis: string | null;
  jedinica: string | null;
  cenaPoJedinici: number | null;
  obim: number | null;
};

export type UnosOdlukeLanca = {
  organ: OrganOdluke;
  broj: string;
  datum: Date;
  tekst: string;
  naziv: string;
  vrstaHrane: VrstaHrane | null;
  koeficijentSirovine: number | null;
  stipsKategorija: string | null;
  jedinica: string;
  dodatakPct: number;
  brojVaucera: number;
  kolicinaPoVauceru: string;
  karike: UnosKarikeLanca[];
};

/**
 * Odluka o lancu (čl. 49) koju operativa upisuje po odluci UO, odnosno Gornjeg Kola:
 *  1) roba; 2) davalac sirovine i koeficijent — za hranu se koeficijent utvrđuje po donacije
 *     čl. 22 (iz odgovora davaoca, `koeficijentHrane`), za drugu sirovinu od 1,00 do 2,00;
 *  3) vrednost sirovine po čl. 40 st. 3 (STIPS, inače cenovnik davaoca); 4–6) partneri redom,
 *  mesto predaje, usluga i vrednost po jedinici iz cenovnika, i ko robu izdaje korisnicima
 *  (poslednji); 7) dodatak za distribuciju u %; 8) broj vaučera i količina po vaučeru.
 */
export function procitajOdlukuLanca(
  b: Record<string, unknown>,
  p: { sada: Date; koeficijentHrane: number | null },
): { ok: true; odluka: UnosOdlukeLanca } | { ok: false; razlog: string } {
  const organ = b.organ === "UPRAVNI_ODBOR" || b.organ === "GORNJE_KOLO" ? b.organ : null;
  if (!organ) return { ok: false, razlog: "Izaberi organ koji je doneo odluku." };
  const brojOdluke = tekst(b.brojOdluke, 60);
  if (brojOdluke.length < 1) return { ok: false, razlog: "Upiši broj odluke." };
  const datum = typeof b.datumOdluke === "string" ? new Date(b.datumOdluke) : null;
  if (!datum || Number.isNaN(datum.getTime()) || datum.getTime() > p.sada.getTime())
    return { ok: false, razlog: "Upiši datum odluke (ne posle današnjeg dana)." };
  const tekstOdluke = typeof b.tekstOdluke === "string" ? b.tekstOdluke.trim().slice(0, 20000) : "";
  if (tekstOdluke.length < 20) return { ok: false, razlog: "Upiši tekst odluke onako kako je doneta." };
  const naziv = tekst(b.naziv, 150);
  if (naziv.length < 3) return { ok: false, razlog: "Upiši robu koja se kroz lanac dobija i raspodeljuje." };
  const vrstaHrane = jeVrstaHrane(b.vrstaHrane) ? b.vrstaHrane : null;
  let koeficijentSirovine: number | null;
  if (vrstaHrane) {
    if (p.koeficijentHrane == null) return { ok: false, razlog: "Za hranu se koeficijent utvrđuje iz podataka o proizvodnji davaoca." };
    koeficijentSirovine = p.koeficijentHrane;
  } else {
    const k = broj(b.koeficijentSirovine);
    if (!Number.isFinite(k) || k < MIN_KOEFICIJENT_SIROVINE || k > MAX_KOEFICIJENT_SIROVINE)
      return { ok: false, razlog: "Koeficijent sirovine koja nije hrana je od 1,00 do 2,00." };
    koeficijentSirovine = Math.round(k * 100) / 100;
  }
  const pct = broj(b.dodatakPct);
  if (!Number.isFinite(pct) || pct < 0 || pct > MAX_DODATAK_PCT) return { ok: false, razlog: "Dodatak za distribuciju je procenat od 0 do 100." };
  const brojV = broj(b.brojVaucera);
  if (!Number.isInteger(brojV) || brojV < 1 || brojV > MAX_VAUCERA_PO_PARTIJI) return { ok: false, razlog: "Broj vaučera je ceo broj veći od nule." };
  const kolicina = tekst(b.kolicinaPoVauceru, 60);
  if (kolicina.length < 1) return { ok: false, razlog: "Upiši količinu robe po vaučeru." };

  const ulaz = Array.isArray(b.karike) ? (b.karike as Record<string, unknown>[]) : [];
  if (ulaz.length < 2) return { ok: false, razlog: "Lanac ima davaoca sirovine i bar jednog partnera." };
  const karike: UnosKarikeLanca[] = [];
  for (let i = 0; i < ulaz.length; i++) {
    const k = ulaz[i] ?? {};
    const uloga: UlogaKarike = i === 0 ? "DAVALAC_SIROVINE" : i === ulaz.length - 1 ? "POSLEDNJI" : "PARTNER";
    const pseudonim = tekst(k.pseudonim, 60);
    const nazivK = tekst(k.naziv, 150);
    const mesto = tekst(k.mestoPredaje, 100);
    if (pseudonim.length < 1) return { ok: false, razlog: `Karika ${i + 1}: upiši pseudonim korisnika u čijem zapisu se evidentira doprinos.` };
    if (nazivK.length < 2) return { ok: false, razlog: `Karika ${i + 1}: upiši naziv davaoca, odnosno partnera.` };
    if (mesto.length < 2) return { ok: false, razlog: `Karika ${i + 1}: upiši mesto predaje robe.` };
    const cena = broj(k.cenaPoJedinici);
    const obim = broj(k.obim);
    if (uloga === "DAVALAC_SIROVINE") {
      karike.push({
        uloga, pseudonim, naziv: nazivK, mestoPredaje: mesto, adresaPredaje: tekst(k.adresaPredaje, 200) || null,
        uslugaOpis: null, jedinica: null, cenaPoJedinici: Number.isFinite(cena) && cena > 0 ? dveDecimale(cena) : null, obim: null,
      });
      continue;
    }
    const uslugaOpis = tekst(k.uslugaOpis, 300);
    const jedinica = tekst(k.jedinica, 30);
    if (uslugaOpis.length < 3) return { ok: false, razlog: `Karika ${i + 1}: opiši uslugu partnera.` };
    if (jedinica.length < 1) return { ok: false, razlog: `Karika ${i + 1}: upiši jedinicu usluge.` };
    if (!Number.isFinite(cena) || cena <= 0) return { ok: false, razlog: `Karika ${i + 1}: upiši vrednost usluge po jedinici iz cenovnika partnera.` };
    if (!Number.isFinite(obim) || obim <= 0) return { ok: false, razlog: `Karika ${i + 1}: upiši obim usluge.` };
    karike.push({
      uloga, pseudonim, naziv: nazivK, mestoPredaje: mesto, adresaPredaje: tekst(k.adresaPredaje, 200) || null,
      uslugaOpis, jedinica, cenaPoJedinici: dveDecimale(cena), obim: dveDecimale(obim),
    });
  }
  return {
    ok: true,
    odluka: {
      organ, broj: brojOdluke, datum, tekst: tekstOdluke, naziv, vrstaHrane, koeficijentSirovine,
      stipsKategorija: tekst(b.stipsKategorija, 120) || null, jedinica: tekst(b.jedinica, 20) || "kg",
      dodatakPct: Math.round(pct * 100) / 100, brojVaucera: brojV, kolicinaPoVauceru: kolicina, karike,
    },
  };
}

// ─── Ugovori (snimljen tekst; bez broja POEN-a i koeficijenta) ───────────────

const rsd = (n: number) => n.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Izjava iz čl. 40 st. 4 nabavki, odnosno čl. 31 st. 3 donacija — ista u svakom ugovoru motora. */
export const IZJAVA_O_DOPRINOSU =
  "Doprinos koji se povodom ovog ugovora evidentira po pravilima KOLO sistema ne određuje se ovim ugovorom; taj upis nije protivčinidba i ugovorna strana na njega nema potraživanje. Upis ne vrši Fondacija, nego Protokol.";

/** Ugovor o donaciji stoke, odnosno mleka (nabavke čl. 40), odnosno sirovine u lancu (čl. 49–50). */
export function generisiUgovorDonacijeTekst(p: {
  vrsta: VrstaLanca;
  datum: Date;
  davalac: string;
  bpg: string | null;
  nosilac: string;
  roba: string;
  hrana: { vrsta: VrstaHrane; kategorija: Kategorija } | null;
  mestoPredaje: string;
  objekat: string;
  stipsKategorija: string | null;
}): string {
  const program = p.vrsta === "PROGRAM_HRANE";
  return [
    program ? "UGOVOR O DONACIJI STOKE, ODNOSNO MLEKA" : "UGOVOR O DONACIJI SIROVINE U LANCU PROIZVODNJE I DISTRIBUCIJE",
    program ? "(program raspodele hrane)" : "",
    "",
    `Zaključen dana ${p.datum.toLocaleDateString("sr-RS")} između:`,
    p.bpg
      ? `1) ${p.nosilac}, nosilac registrovanog poljoprivrednog gazdinstva „${p.davalac}", broj gazdinstva ${p.bpg} (u daljem tekstu: Davalac), i`
      : `1) ${p.davalac}, koga zastupa ${p.nosilac} (u daljem tekstu: Davalac), i`,
    `2) ${FONDACIJA} (u daljem tekstu: Fondacija).`,
    "",
    `Član 1. Davalac se obavezuje da Fondaciji bez naknade preda: ${p.roba}.` +
      (p.hrana
        ? ` Predmet je hrana (${HRANA_U_UGOVORU.vrsta[p.hrana.vrsta]}); poreklo, koje Fondacija utvrđuje zaključenjem ovog ugovora na osnovu podataka Davaoca: ${HRANA_U_UGOVORU.kategorija[p.hrana.kategorija]}.`
        : ""),
    `Član 2. Svojina prelazi na Fondaciju predajom u objektu „${p.objekat}" (${p.mestoPredaje}). Masa se utvrđuje vagom objekta i upisuje u zapisnik o primopredaji` +
      (program ? ", uz oznake životinja." : "."),
    `Član 3. Vrednost predatog jednaka je masi pomnoženoj poslednjom prosečnom cenom za Republiku Srbiju objavljenom pre predaje u sistemu tržišnih informacija ministarstva nadležnog za poljoprivredu` +
      (p.stipsKategorija ? `, za kategoriju „${p.stipsKategorija}"` : ", za tu kategoriju") +
      ". Ako takva cena ne postoji, vrednost se utvrđuje cenom iz cenovnika Davaoca. Fondacija vrednost ne procenjuje.",
    `Član 4. Donacija je dobrovoljna i bez naknade. Davalac njome ne stiče potraživanje prema Fondaciji niti bilo koju prednost u postupcima Fondacije. ${IZJAVA_O_DOPRINOSU}`,
    "Član 5. Davalac izjavljuje da su podaci o proizvodnji koje je dao tačni" + (program ? " i da su životinje obeležene i upisane po propisima." : "."),
    "Član 6. Fondacija hranu, odnosno robu ne prodaje i za nju ne prima naknadu ni od korisnika ni od trećeg lica.",
    "Član 7. Ugovor se zaključuje elektronskim putem na platformi KOLO: Fondacija ga predlaže, a Davalac prihvata potvrdom na platformi. Platforma čuva tekst ugovora onakav kakav je bio u trenutku zaključenja.",
  ].filter((r, i) => r !== "" || i > 1).join("\n");
}

/** Ugovor o usluzi objekta (nabavke čl. 42), odnosno o partnerstvu u lancu (čl. 50; donacije čl. 42). */
export function generisiUgovorUslugeTekst(p: {
  vrsta: VrstaLanca;
  datum: Date;
  partner: string;
  zastupnik: string;
  roba: string;
  uslugaOpis: string;
  jedinica: string;
  cenaPoJedinici: number;
  obim: number | null;
  mestoPredaje: string;
  izdajeKorisnicima: boolean;
  dodatakPct: number | null;
}): string {
  const program = p.vrsta === "PROGRAM_HRANE";
  const vrednost = p.obim != null ? vrednostUsluge(p.cenaPoJedinici, p.obim) : null;
  return [
    program ? "UGOVOR O USLUZI OBJEKTA" : "UGOVOR O PARTNERSTVU U LANCU PROIZVODNJE I DISTRIBUCIJE",
    program ? "(program raspodele hrane)" : "",
    "",
    `Zaključen dana ${p.datum.toLocaleDateString("sr-RS")} između:`,
    `1) ${p.partner}, koga zastupa ${p.zastupnik} (u daljem tekstu: ${program ? "Objekat" : "Partner"}), i`,
    `2) ${FONDACIJA} (u daljem tekstu: Fondacija).`,
    "",
    program
      ? `Član 1. Objekat se obavezuje da obradi hranu (${p.roba}), da je čuva u ime Fondacije i da je izda imaocima vaučera, na adresi: ${p.mestoPredaje}. Fondacija Objektu za uslugu ne plaća.`
      : `Član 1. Partner se obavezuje da robu (${p.roba}) bez naknade ${p.uslugaOpis}, u ime Fondacije, i da je ${p.izdajeKorisnicima ? "izda imaocima vaučera" : "preda sledećem partneru u lancu"}; mesto predaje: ${p.mestoPredaje}. Svojina na robi pripada Fondaciji.`,
    `Član 2. Usluga: ${p.uslugaOpis}. Vrednost usluge jednaka je ceni iz cenovnika (${rsd(p.cenaPoJedinici)} dinara po jedinici „${p.jedinica}") pomnoženoj obimom izvršene usluge` +
      (vrednost != null ? `; ugovoreni obim je ${p.obim}, a vrednost ${rsd(vrednost)} dinara.` : ".") +
      " Fondacija cenu ne procenjuje, ne upoređuje i ne određuje.",
    program
      ? "Član 3. Nusproizvodi obrade pripadaju Objektu, koji ih zadržava. Po isteku roka za preuzimanje Objekat može da preuzme nepreuzete delove i da ih proda u svoje ime, uz propisan račun; delove koje ne preuzme Fondacija predaje kroz program podrške ili ustanovi socijalne zaštite."
      : p.izdajeKorisnicima && p.dodatakPct
        ? `Član 3. Partneru koji robu izdaje korisnicima beleži se i dodatak za distribuciju od ${p.dodatakPct}% vrednosti izdate robe, kada Fondacija utvrdi da je roba izdata.`
        : "Član 3. Predaju robe Partner beleži na platformi, a Fondacija utvrđuje da je usluga izvršena.",
    program
      ? "Član 4. Za bezbednost hrane dok je kod njega Objekat odgovara neposredno imaocu vaučera. Fondacija ne pruža usluge Objekta i ne odgovara za njihovo izvršenje."
      : "Član 4. Za robu dok je kod njega Partner odgovara po propisima. Fondacija nema obavezu da Partnera ističe ili promoviše.",
    `Član 5. Usluga je bez naknade. ${program ? "Objekat" : "Partner"} njome ne stiče potraživanje prema Fondaciji niti prednost u bilo kom postupku Fondacije. ${IZJAVA_O_DOPRINOSU}`,
    `Član 6. Ugovor se zaključuje elektronskim putem na platformi KOLO: Fondacija ga predlaže, a ${program ? "Objekat" : "Partner"} prihvata potvrdom na platformi. Platforma čuva tekst ugovora onakav kakav je bio u trenutku zaključenja.`,
  ].filter((r, i) => r !== "" || i > 1).join("\n");
}

/** Tekst zapisa odluke o lancu za prikaz (snima se jednom, čl. 48 st. 2). */
export function oznakaOrgana(o: OrganOdluke): string {
  return o === "GORNJE_KOLO" ? "Gornje Kolo" : "Upravni odbor";
}
