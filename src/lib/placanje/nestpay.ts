import crypto from "node:crypto";

/**
 * NestPay / AllSecure (Asseco SEE / Payten) provajder za kartično plaćanje.
 *
 * I Banca Intesa i OTP banka Srbija koriste isti NestPay e-commerce gateway
 * (3D Secure, „hosted" model). Zato je provajder jedinstven, a razlika između
 * banaka je samo u konfiguraciji (gateway URL, clientid, store key).
 *
 * BEZBEDNOSNI MODEL (PCI-DSS, minimalni opseg / SAQ-A):
 *  - Korisnik unosi podatke o kartici ISKLJUČIVO na hostovanoj stranici banke.
 *    Brojevi kartica NIKAD ne dolaze do KOLO servera niti se loguju/čuvaju.
 *  - Zahtev se potpisuje HASH-om (ver3, SHA-512) izvedenim iz tajnog store key-a.
 *  - Odgovor banke se OBAVEZNO verifikuje istim HASH algoritmom pre nego što se
 *    donacija prizna i emituje POEN — tako lažna/izmenjena poruka ne prolazi.
 *
 * NAPOMENA: tačan hash algoritam (ver3) usklađen je sa zvaničnom NestPay
 * dokumentacijom. Pošto integracioni parametri (clientid/store key/URL) stižu
 * tek uz odobren trgovački nalog, vrednosti se drže u env varijablama i
 * potvrđuju protiv test okruženja banke pre puštanja uživo.
 */

export type Provajder = "INTESA" | "OTP";

export interface NestpayConfig {
  provajder: Provajder;
  gatewayUrl: string;
  clientId: string;
  storeKey: string;
  storeType: string;
}

/** RSD po ISO 4217 (NestPay očekuje numerički kod valute). */
export const VALUTA_RSD = "941";

/** Da li je kartično plaćanje uopšte uključeno (env prekidač). */
export function placanjeAktivno(): boolean {
  return process.env.PLACANJE_AKTIVNO === "true";
}

/**
 * Učitava konfiguraciju izabranog provajdera iz env varijabli.
 * Vraća null ako provajder nije konfigurisan (npr. još nema trgovački nalog) —
 * pozivalac tada treba da vrati jasnu poruku, a ne da pokuša plaćanje.
 */
export function dohvatiNestpayConfig(provajder?: string): NestpayConfig | null {
  const izbor = (provajder || process.env.PLACANJE_PROVAJDER || "INTESA").toUpperCase();
  if (izbor !== "INTESA" && izbor !== "OTP") return null;

  const prefix = `NESTPAY_${izbor}`;
  const gatewayUrl = process.env[`${prefix}_GATEWAY_URL`] ?? "";
  const clientId = process.env[`${prefix}_CLIENT_ID`] ?? "";
  const storeKey = process.env[`${prefix}_STORE_KEY`] ?? "";
  const storeType = process.env[`${prefix}_STORE_TYPE`] ?? "3d_pay_hosting";

  if (!gatewayUrl || !clientId || !storeKey) return null;

  return { provajder: izbor as Provajder, gatewayUrl, clientId, storeKey, storeType };
}

/** Escape vrednosti za ver3 hash: `\` → `\\`, zatim `|` → `\|`. */
function escapeVal(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

/**
 * NestPay ver3 HASH: sve parametre (osim `hash` i `encoding`) sortiraj po imenu
 * (case-insensitive), escape-uj vrednosti, spoji sa `|`, dodaj escape-ovan store
 * key na kraj, pa SHA-512 → Base64. Identičan algoritam koristi se i za
 * generisanje zahteva i za verifikaciju odgovora.
 */
export function nestpayHashVer3(params: Record<string, string>, storeKey: string): string {
  const kljucevi = Object.keys(params)
    .filter((k) => {
      const lk = k.toLowerCase();
      return lk !== "hash" && lk !== "encoding";
    })
    .sort((a, b) => {
      const la = a.toLowerCase();
      const lb = b.toLowerCase();
      return la < lb ? -1 : la > lb ? 1 : 0;
    });

  const plaintext = kljucevi.map((k) => escapeVal(params[k] ?? "")).join("|");
  const zaHash = `${plaintext}|${escapeVal(storeKey)}`;
  return crypto.createHash("sha512").update(zaHash, "utf8").digest("base64");
}

/** Konstantno-vremensko poređenje dva stringa (anti-timing). */
function bezbednoJednako(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Verifikuje HASH iz odgovora banke. Vraća true samo ako se izračunati hash
 * (preko store key-a) poklapa sa vraćenim `HASH`/`hash` poljem.
 */
export function verifikujOdgovor(params: Record<string, string>, storeKey: string): boolean {
  const primljeni = params["HASH"] ?? params["hash"] ?? "";
  if (!primljeni) return false;
  const izracunati = nestpayHashVer3(params, storeKey);
  return bezbednoJednako(izracunati, primljeni);
}

/** Da li odgovor banke predstavlja uspešno autorizovano (i 3D-overeno) plaćanje. */
export function uspesnoPlacanje(params: Record<string, string>): boolean {
  const response = (params["Response"] ?? "").toLowerCase();
  const mdStatus = params["mdStatus"] ?? "";
  const procReturnCode = params["ProcReturnCode"] ?? "";
  // 3D Secure: mdStatus 1–4 = autentikacija prošla/pokušana; Response=Approved
  // ili ProcReturnCode=00 = transakcija autorizovana.
  const overen3D = ["1", "2", "3", "4"].includes(mdStatus);
  const autorizovan = response === "approved" || procReturnCode === "00";
  return overen3D && autorizovan;
}

export interface ZahtevZaPlacanje {
  oid: string;
  iznosRSD: number;
  okUrl: string;
  failUrl: string;
  email?: string;
  lang?: string;
}

export interface PripremljenZahtev {
  gatewayUrl: string;
  fields: Record<string, string>;
}

/**
 * Priprema polja forme koja se (auto-)POST-uju na NestPay gateway. Klijent samo
 * submit-uje formu — korisnik se preusmerava na 3D stranicu banke.
 */
export function pripremiZahtev(cfg: NestpayConfig, z: ZahtevZaPlacanje): PripremljenZahtev {
  const rnd = crypto.randomBytes(16).toString("hex");
  const fields: Record<string, string> = {
    clientid: cfg.clientId,
    storetype: cfg.storeType,
    trantype: "Auth",
    amount: z.iznosRSD.toFixed(2),
    currency: VALUTA_RSD,
    oid: z.oid,
    okUrl: z.okUrl,
    failUrl: z.failUrl,
    lang: z.lang ?? "sr",
    rnd,
    hashAlgorithm: "ver3",
    refreshtime: "5",
    encoding: "UTF-8",
  };
  if (z.email) fields.email = z.email;

  fields.hash = nestpayHashVer3(fields, cfg.storeKey);
  return { gatewayUrl: cfg.gatewayUrl, fields };
}
