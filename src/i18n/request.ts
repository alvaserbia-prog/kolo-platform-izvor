import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";
import { lat2cyrDeep } from "@/lib/lat2cyr";

type Locale = (typeof routing.locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    locale = routing.locales.includes(cookieLocale as Locale)
      ? (cookieLocale as string)
      : routing.defaultLocale;
  }

  // "sr-Cyrl" nema sopstveni fajl poruka — koristi "sr" (latinica) kao izvor
  // i transliteriše string vrednosti u ćirilicu (server-side, smanjuje „bljesak").
  const isCyrl = locale === "sr-Cyrl";
  const izvorLocale = isCyrl ? "sr" : locale;

  const messages = (await import(`../../messages/${izvorLocale}.json`)).default;

  // Namespace `admin` se NE prevodi (odluka vlasnika) i postoji ISKLJUČIVO u
  // `sr.json`. Admin panel je alat Upravnog odbora — terminologija mu preslikava
  // akte, a merodavan je srpski original; četiri paralelne pravne terminologije
  // niko ne bi održavao. Do ove izmene je namespace stajao u sva četiri prevoda i
  // bio NAPOLA preveden (177 od 450 ključeva), pa je isti red tabova glasio
  // „Overview, Members, … Razmene, Nabavke". Izostavljanjem prevoda ta razlika
  // fizički ne može da nastane.
  //
  // `sr-Cyrl` ovde ne ulazi: izvor mu je `sr`, pa admin blok već ima i prolazi
  // kroz transliteraciju zajedno sa ostatkom — ćirilica nije prevod, nego pismo.
  const sveporuke =
    izvorLocale === "sr"
      ? messages
      : { ...messages, admin: (await import("../../messages/sr.json")).default.admin };

  return {
    locale,
    messages: isCyrl ? lat2cyrDeep(sveporuke) : sveporuke,
  };
});
