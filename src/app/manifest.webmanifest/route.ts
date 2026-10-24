import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

/**
 * PWA manifest — ime i opis aplikacije na početnom ekranu telefona.
 *
 * Bio je statičan fajl (`public/manifest.webmanifest`) sa zakucanim srpskim
 * tekstom. Sada je ruta, jer manifest traži PREGLEDAČ korisnika i šalje kolačić
 * `NEXT_LOCALE` — pa se opis može dati na jeziku korisnika.
 *
 * (Za razliku od ovoga, OG slika se NE može lokalizovati: nju povlače pauci
 * društvenih mreža, bez kolačića. Vidi docs/i18n-ruski-plan.md.)
 */
const OPIS: Record<string, string> = {
  sr: "Sistem uzajamnosti zasnovan na doprinosu zajednici",
  "sr-Cyrl": "Систем узајамности заснован на доприносу заједници",
  en: "A system of mutuality based on contribution to the community",
  ru: "Система взаимности, основанная на вкладе в сообщество",
  hr: "Sustav uzajamnosti utemeljen na doprinosu zajednici",
  hu: "A közösséghez való hozzájáruláson alapuló kölcsönösségi rendszer",
};

export async function GET() {
  const jar = await cookies();
  const trazen = jar.get("NEXT_LOCALE")?.value ?? routing.defaultLocale;
  const locale = routing.locales.includes(trazen as never) ? trazen : routing.defaultLocale;

  return Response.json(
    {
      name: "KOLO",
      short_name: "KOLO",
      description: OPIS[locale] ?? OPIS.sr,
      start_url: "/pocetna",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#1b3a2b",
      lang: locale,
      icons: [
        { src: "/kolo-icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/kolo-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
