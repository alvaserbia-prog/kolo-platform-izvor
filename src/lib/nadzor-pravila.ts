/**
 * Nadzor verifikacija — ČISTE funkcije i šifarnik.
 *
 * Bez Prisme, jer ovo uvozi i klijentska forma na `/nadzor` (isti razlog zbog kog
 * su pravila doprinosa sadržaju razdvojena od servisa). Servisni deo je u
 * `src/lib/protokol/nadzor-service.ts`, koji ovo re-eksportuje.
 *
 * Osnov: Pravilnik o dokazu stvarnosti čl. 24.
 */

export type Ishod = "UREDNO" | "ZA_PROVERU" | "SPORNO";
export type Subjekt = "VERIFIKATOR" | "VERIFIKOVANI" | "OBA" | "DEO_MREZE";

/** Šifre razloga iz čl. 24 st. 4 — zatvorena lista, ne slobodan tekst. */
export const RAZLOZI = [
  "ne_poznaju_se",
  "nalog_bez_znakova",
  "dvostruki_nalog",
  "obrazac_verifikacija",
  "prijava_verifikovanog",
  "ostalo",
] as const;
export type Razlog = (typeof RAZLOZI)[number];

export const SUBJEKTI: Subjekt[] = ["VERIFIKATOR", "VERIFIKOVANI", "OBA", "DEO_MREZE"];
export const ISHODI: Ishod[] = ["UREDNO", "ZA_PROVERU", "SPORNO"];

/** Ishodi koji izražavaju sumnju — traže obrazloženje i otvaraju nadzorni predmet. */
export function jeSumnja(ishod: Ishod): boolean {
  return ishod === "ZA_PROVERU" || ishod === "SPORNO";
}

// 🔴 Ishod nadzora više ne dopunjava slot verifikatora — slotovi su ukinuti setom
// 4.7.5 (dokaz stvarnosti čl. 8 i 11). `dopunjavaSlot` je uklonjen; ne vraćati ga.

export type ValidacijaGreska =
  | { ok: true }
  | { ok: false; poruka: string };

/**
 * Provera obaveznih polja uz ishod (čl. 24 st. 3).
 * Uz „za proveru" i „sporno" subjekt sumnje i šifra razloga su OBAVEZNI —
 * bez njih predmet ne bi imao šta da kaže Upravnom odboru. Uz „uredno" se
 * ne traži obrazloženje i eventualno poslata polja se ignorišu.
 */
export function validirajIshod(input: {
  ishod: string;
  subjekt?: string | null;
  razlog?: string | null;
  opis?: string | null;
}): ValidacijaGreska {
  if (!ISHODI.includes(input.ishod as Ishod)) {
    return { ok: false, poruka: "Nepoznat ishod nadzora." };
  }
  const ishod = input.ishod as Ishod;
  if (!jeSumnja(ishod)) return { ok: true };

  if (!input.subjekt || !SUBJEKTI.includes(input.subjekt as Subjekt)) {
    return { ok: false, poruka: "Uz ovaj ishod mora se navesti na koga se sumnja." };
  }
  if (!input.razlog || !RAZLOZI.includes(input.razlog as Razlog)) {
    return { ok: false, poruka: "Uz ovaj ishod mora se izabrati razlog sa liste." };
  }
  if (input.razlog === "ostalo" && !input.opis?.trim()) {
    return { ok: false, poruka: "Uz razlog „ostalo“ mora se ukratko opisati o čemu se radi." };
  }
  return { ok: true };
}
