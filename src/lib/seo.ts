/**
 * Centralna SEO konfiguracija.
 *
 * Dva okruženja dele isti kod (vidi CLAUDE.md):
 *  - PRODUKCIJA: ekolo.rs  → indeksirati, canonical na ekolo.rs
 *  - TEST: *.vercel.app    → noindex (da Google ne tretira kao duplikat prod-a)
 *
 * `VERCEL_ENV` je "production" samo na production grani. Sve ostalo (preview,
 * development, lokalno) tretiramo kao ne-indeksabilno.
 */

/** Kanonski domen produkcije — apsolutni URL-ovi i canonical uvek vode ovde.
 *  Primarni domen je ekolo.rs (bez www); www radi redirect na njega. */
export const SITE_URL = "https://ekolo.rs";

/** Ime sistema za naslove i strukturirane podatke. */
export const SITE_NAME = "KOLO";

/** Da li je trenutni deploy produkcija (jedino okruženje koje sme da se indeksira). */
export const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

/**
 * Podrazumevani opis sistema (fallback kad stranica nema svoj) — SRPSKI.
 *
 * ⚠️ Prevedena varijanta je u `messages/*.json` pod `seo.site_opis` i koristi se
 * u `app/layout.tsx` (naslov, description, OG/Twitter, JSON-LD). Ova konstanta
 * ostaje samo kao fallback za mesta koja nemaju pristup locale-u. Ako dodaješ
 * novi opis u <head>, uzmi ga iz prevoda — ovo je ono što je Google prikazivao
 * na srpskom i ruskim i mađarskim posetiocima.
 */
export const SITE_DESCRIPTION =
  "KOLO je sistem evidencije doprinosa zajedničkom dobru, zasnovan na uzajamnosti. " +
  "POEN beleži tvoj doprinos i učešće, ZRNO ti daje glas u odlukama. Članstvo je besplatno.";

/** Apsolutni URL od relativne putanje (npr. "/pijaca" → "https://ekolo.rs/pijaca"). */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

import type { Metadata } from "next";

/** BCP-47 oznake i OG locale po internom kodu jezika (next-intl locale). */
export const OG_LOCALE: Record<string, string> = {
  sr: "sr_RS",
  "sr-Cyrl": "sr_RS",
  en: "en_US",
  hu: "hu_HU",
  ru: "ru_RU",
  hr: "hr_HR",
};

/**
 * hreflang `languages` mapa za zadatu putanju.
 *
 * ⚠️ TRENUTNO ONEMOGUĆENO: jezici se biraju preko cookie-a na ISTOM URL-u (nema
 * /en, /hu, /sr-Cyrl ruta — projekat koristi ravno stablo). Emitovanje hreflang
 * linkova na nepostojeće prefiks-URL-ove slalo bi Google na 404. Vraća praznu
 * mapu dok se ne uvede app/[locale]/ struktura (vidi docs/i18n-engleski-plan.md).
 */
export function hreflangAlternates(_path = "/"): Record<string, string> {
  return {};
}

/**
 * Konzistentna metadata za javnu stranicu: naslov (kroz template `%s — KOLO`),
 * opis, self-canonical i OG/Twitter. Dinamičku OG sliku obezbeđuje
 * `opengraph-image.tsx` (file convention) za sve rute — ne navodi se ovde.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  // `absolute` zaobilazi root template (`%s — KOLO`) — naslovi već sadrže brend
  // gde treba, pa izbegavamo dupli „— KOLO — KOLO".
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path, languages: hreflangAlternates(path) },
    openGraph: {
      type: "website",
      locale: "sr_RS",
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
