/**
 * IPS QR (NBS Instant Payments Serbia) — generisanje QR koda za instant
 * dinarsko plaćanje donacija.
 *
 * MODEL:
 *  - Platforma generiše DINAMIČKI IPS QR po svakoj donaciji: račun primaoca
 *    (Fondacija), naziv, tačan iznos i JEDINSTVEN poziv na broj (model 97).
 *  - Donator skenira QR mobilnom bankom → instant prenos u RSD direktno na
 *    račun Fondacije (bez konverzije na našoj strani, provizija ~0).
 *  - USAGLAŠAVANJE (MVP): admin nađe priliv u bankovnom izvodu po pozivu na
 *    broj i potvrdi PENDING zapis u admin panelu → tek tada se emituje POEN.
 *    🔴 Zapis potvrđuje ČOVEK i to se ne menja (R-01, mera M-4a): potvrda traži
 *    poređenje uplatioca iz izvoda sa nalogom (čl. 3 Pravilnika o pokroviteljstvu
 *    i donacijama). Automatsko evidentiranje po bankarskom callback-u je upravo
 *    ono što je kod kartice ukinuto — ne uvoditi ga ovde.
 *
 * KONFIGURACIJA (unosi se NAKNADNO kroz env, kao i NestPay):
 *  - `IPS_RACUN`          — broj računa Fondacije, 18 cifara BEZ crtica (obavezno)
 *  - `IPS_PRIMALAC`       — naziv primaoca, npr. "Fondacija KOLO" (obavezno)
 *  - `IPS_PRIMALAC_MESTO` — mesto/grad primaoca (opciono, dodaje se uz naziv)
 *  - `IPS_SF`             — šifra plaćanja, 3 cifre (opciono, podrazumevano 289)
 *  - `IPS_SVRHA`          — svrha plaćanja (opciono, podrazumevano "Donacija")
 *  - `IPS_MAX_RSD`        — gornji limit po transakciji (opciono; vidi napomenu)
 *  - `IPS_AKTIVNO`        — "false" gasi IPS i kad je račun podešen (opciono)
 *
 * Dok `IPS_RACUN`/`IPS_PRIMALAC` nisu podešeni (ili račun nije 18 cifara),
 * `dohvatiIpsConfig()` vraća null → pozivalac vraća jasnu poruku „nije
 * konfigurisano", ne pokušava da generiše QR. Tako kod živi i bez računa.
 *
 * NAPOMENA (pre puštanja uživo): tačan skup tagova, dozvoljene dužine i limit
 * iznosa po instant transakciji uskladiti sa AKTUELNIM NBS standardom „IPS QR
 * kod" i propustiti svaki generisani string kroz zvanični NBS validator.
 */

/** Donji limit donacije (RSD), isto kao kartični tok. */
export const MIN_IPS_RSD = 100;

/**
 * Podrazumevani gornji limit po jednoj IPS transakciji (RSD). NBS instant
 * shema ima limit po nalogu; istorijski 300.000, povremeno podizan. Držimo
 * konzervativnu podrazumevanu vrednost koja se može podići preko `IPS_MAX_RSD`.
 * Veće donacije i dalje idu klasičnom uplatom/karticom.
 */
export const PODRAZUMEVANI_MAX_IPS_RSD = 300_000;

export interface IpsConfig {
  racun: string;        // 18 cifara
  primalac: string;     // naziv (+ opciono mesto)
  sifraPlacanja: string; // 3 cifre
  svrha: string;
  maxRSD: number;
}

/** Da li je IPS QR uopšte uključen (i podešen). */
export function ipsAktivno(): boolean {
  if (process.env.IPS_AKTIVNO === "false") return false;
  return dohvatiIpsConfig() !== null;
}

/** Validan IPS naziv: bez separatora `|` i kontrolnih znakova, max 70. */
function ocistiNaziv(s: string): string {
  return s.replace(/[|\r\n]+/g, " ").trim().slice(0, 70);
}

/**
 * Učitava IPS konfiguraciju iz env. Vraća null ako račun/naziv nedostaju ili
 * račun nije tačno 18 cifara (fail-safe: radije ništa nego neispravan QR).
 */
export function dohvatiIpsConfig(): IpsConfig | null {
  const racun = (process.env.IPS_RACUN ?? "").replace(/\D/g, "");
  const primalacRaw = process.env.IPS_PRIMALAC ?? "";
  if (racun.length !== 18 || !primalacRaw.trim()) return null;

  const mesto = (process.env.IPS_PRIMALAC_MESTO ?? "").trim();
  const primalac = ocistiNaziv(mesto ? `${primalacRaw}, ${mesto}` : primalacRaw);

  const sf = (process.env.IPS_SF ?? "289").replace(/\D/g, "").slice(0, 3) || "289";
  const svrha = ocistiNaziv(process.env.IPS_SVRHA ?? "Donacija") || "Donacija";

  const maxRaw = Math.round(Number(process.env.IPS_MAX_RSD));
  const maxRSD = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : PODRAZUMEVANI_MAX_IPS_RSD;

  return { racun, primalac, sifraPlacanja: sf, svrha, maxRSD };
}

/**
 * Kontrolni broj za model 97 (ISO 7064 MOD 97-10), 2 cifre.
 * Postupak (NBS): kontrola = 98 − ((osnova × 100) mod 97), dopuni vodećom nulom.
 * `osnova` su samo cifre (string), bez kontrole.
 */
export function model97Kontrola(osnova: string): string {
  const cifre = osnova.replace(/\D/g, "");
  if (!cifre) throw new Error("Osnova poziva na broj mora imati cifre.");
  // (osnova × 100) mod 97 — inkrementalno nad cifr"+"00", bez BigInt-a (radi za
  // proizvoljnu dužinu i ne zavisi od ES2020 targeta).
  let ostatak = 0;
  for (const ch of cifre + "00") {
    ostatak = (ostatak * 10 + (ch.charCodeAt(0) - 48)) % 97;
  }
  const kontrola = 98 - ostatak;
  return kontrola.toString().padStart(2, "0");
}

/**
 * Generiše poziv na broj po modelu 97: vraća deo bez modela (kontrola + osnova).
 * Npr. osnova "1234567890" → "KK1234567890". U IPS `RO` tagu ispred ide model
 * "97" (vidi `sklopiIpsString`).
 */
export function generisiPozivNaBroj(osnova: string): string {
  const cifre = osnova.replace(/\D/g, "");
  return `${model97Kontrola(cifre)}${cifre}`;
}

/**
 * Poziv na broj (bez modela) za člana: 2 kontrolne cifre (model 97) + trajni
 * donatorski broj. Isti za SVE uplate člana — IPS QR i klasična uplatnica —
 * pa se svaki priliv u izvodu odmah uparuje sa članom.
 */
export function pozivNaBrojZaClana(donatorskiBroj: number): string {
  if (!Number.isInteger(donatorskiBroj) || donatorskiBroj <= 0) {
    throw new Error("Donatorski broj mora biti pozitivan ceo broj.");
  }
  return generisiPozivNaBroj(String(donatorskiBroj));
}

/** Prikaz poziva na broj za ljude: kontrola-osnova, npr. "42-15". */
export function prikazPozivNaBroj(pozivNaBroj: string): string {
  const cifre = pozivNaBroj.replace(/\D/g, "");
  return cifre.length > 2 ? `${cifre.slice(0, 2)}-${cifre.slice(2)}` : cifre;
}

/**
 * Rasčlanjuje poziv na broj (admin unos / prepis iz izvoda) na donatorski broj.
 * Prihvata razmake i crtice, kao i opcioni prefiks modela "97". Vraća donatorski
 * broj ili null ako kontrolne cifre ne odgovaraju (greška u kucanju) — vodeće
 * nule u osnovi ne smetaju (mod 97 je nad numeričkom vrednošću).
 */
export function rasclaniPozivNaBroj(unos: string): number | null {
  const cifre = (unos ?? "").replace(/\D/g, "");
  const probaj = (s: string): number | null => {
    if (s.length < 3) return null;
    if (model97Kontrola(s.slice(2)) !== s.slice(0, 2)) return null;
    const broj = Number(s.slice(2));
    return Number.isSafeInteger(broj) && broj > 0 ? broj : null;
  };
  // Prvo ceo unos kao kontrola+osnova; ako ne prolazi a počinje sa "97",
  // tretiraj taj prefiks kao oznaku modela i probaj ostatak.
  return probaj(cifre) ?? (cifre.startsWith("97") ? probaj(cifre.slice(2)) : null);
}

/**
 * Format iznosa za IPS `I` tag: "RSD" + iznos sa decimalnim ZAREZOM i 2
 * decimale, BEZ separatora hiljada. Npr. 3000 → "RSD3000,00".
 */
export function formatIznosIps(rsd: number): string {
  const ceo = Math.round(rsd); // donacije su celi RSD u ovom toku
  return `RSD${ceo},00`;
}

export interface IpsStringParams {
  cfg: IpsConfig;
  iznosRSD: number;
  /** Poziv na broj BEZ modela (kontrola + osnova), iz `generisiPozivNaBroj`. */
  pozivNaBroj: string;
}

/**
 * Sklapa IPS QR string po NBS standardu „IPS QR kod" (tagovi `oznaka:vrednost`
 * razdvojeni znakom `|`). Redosled: K, V, C, R, N, I, SF, S, RO.
 *
 * Primer:
 *   K:PR|V:01|C:1|R:845000000040484987|N:Fondacija KOLO|I:RSD3000,00|SF:289|S:Donacija|RO:97KK...
 */
export function sklopiIpsString({ cfg, iznosRSD, pozivNaBroj }: IpsStringParams): string {
  const polja = [
    ["K", "PR"],
    ["V", "01"],
    ["C", "1"],
    ["R", cfg.racun],
    ["N", cfg.primalac],
    ["I", formatIznosIps(iznosRSD)],
    ["SF", cfg.sifraPlacanja],
    ["S", cfg.svrha],
    // Model 97 + poziv na broj (kontrola+osnova). Bez razmaka, po standardu.
    ["RO", `97${pozivNaBroj.replace(/\D/g, "")}`],
  ];
  return polja.map(([k, v]) => `${k}:${v}`).join("|");
}
