/**
 * Formatiranje datuma i brojeva po aktivnom jeziku.
 *
 * Ranije je ceo interfejs bio zakucan na `toLocaleString("sr-RS")`, pa su
 * Englezi (i sutra Rusi) videli srpski format. Uz to je `"sr-RS"` bez oznake
 * pisma vraćao ĆIRILIČNE nazive meseci ("05. август 2026.") i latiničnim
 * korisnicima — zato mapa ispod eksplicitno navodi pismo.
 *
 * Brojevi: sr → 1.234.567,89 · en → 1,234,567.89 · ru → 1 234 567,89
 */

/**
 * next-intl locale → pun BCP-47 tag za Intl.
 *
 * 🔴 Mora da pokrije SVE jezike iz `src/i18n/routing.ts`. Jezik koji nedostaje
 * ne pravi grešku nego TIHO pada na srpski format: `hr` i `hu` su ovde
 * nedostajali otkad su odmrznuti (2026-08-06), pa je Mađar video datum poređan
 * po srpski („18. 08. 2026." umesto „2026. 08. 18."). Isti obrazac propusta kao
 * u `ekran-poruke.ts` — brana je `__tests__/format.test.ts`.
 */
const TAG: Record<string, string> = {
  sr: "sr-Latn-RS",
  "sr-Cyrl": "sr-Cyrl-RS",
  en: "en-GB", // dan-pre-meseca, kao u srpskom
  ru: "ru-RU",
  hr: "hr-HR",
  hu: "hu-HU",
};

/** Podrazumevano srpska latinica — nepoznat locale ne sme da obori prikaz. */
export function intlTag(locale: string): string {
  return TAG[locale] ?? TAG.sr;
}

/** Broj sa razdvajačem hiljada po jeziku. */
export function fmtBroj(
  n: number,
  locale: string,
  opcije?: Intl.NumberFormatOptions,
): string {
  return n.toLocaleString(intlTag(locale), opcije);
}

/** Datum po jeziku. Prima Date ili ISO string. */
export function fmtDatum(
  d: Date | string | number,
  locale: string,
  opcije?: Intl.DateTimeFormatOptions,
): string {
  return new Date(d).toLocaleDateString(intlTag(locale), opcije);
}

/** Datum + vreme po jeziku. */
export function fmtDatumVreme(
  d: Date | string | number,
  locale: string,
  opcije?: Intl.DateTimeFormatOptions,
): string {
  return new Date(d).toLocaleString(intlTag(locale), opcije);
}
