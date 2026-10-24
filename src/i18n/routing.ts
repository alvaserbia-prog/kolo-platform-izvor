import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // "sr" = srpski (latinica, default), "sr-Cyrl" = srpski (ćirilica, transliteracijom),
  // "en" = engleski, "ru" = ruski. Jezik se bira preko cookie-a (NEXT_LOCALE),
  // bez URL prefiksa — projekat koristi RAVNO stablo ruta (nema app/[locale]/).
  //
  // ⚠️ NAPOMENA: URL prefiks (/en/…) za SEO zahteva restrukturaciju u app/[locale]/
  // (vidi docs/i18n-engleski-plan.md). Dok se to ne uradi, ostaje "never" — inače
  // next-intl middleware preusmerava na nepostojeće [locale] rute → 404 ceo sajt.
  //
  // 🇭🇷 HRVATSKI i 🅷🆄 MAĐARSKI su ODMRZNUTI 2026-08-06: dopunjeni do punog
  // pariteta, vraćeni u proveru (scripts/check-i18n-parity.mjs) i izloženi u
  // prekidaču jezika. Ranije su bili neaktivni i zato su odlutali — svaki nov
  // ključ ostajao je srpski. Ne zamrzavati ih ponovo bez izbacivanja iz parity
  // skripte, inače provera prestaje da hvata regresiju.
  //
  // FAQ ima sopstveni set po jeziku (faq-data-<kod>.ts) i NIJE u messages/, pa ga
  // parity skripta ne vidi — pokriva ga __tests__/faq-paritet.test.ts.
  //
  // 🇷🇺 RUSKI je aktivan i izložen u prekidaču jezika (od 2026-08-05).
  // Prevod: messages/ru.json — vidi docs/i18n-ruski-plan.md.
  locales: ["sr", "sr-Cyrl", "en", "ru", "hr", "hu"],
  defaultLocale: "sr",
  localePrefix: "never",
});
