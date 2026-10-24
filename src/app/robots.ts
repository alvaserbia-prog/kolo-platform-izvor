import type { MetadataRoute } from "next";
import { SITE_URL, IS_PRODUCTION, absoluteUrl } from "@/lib/seo";

/**
 * robots.txt.
 *  - PRODUKCIJA (ekolo.rs): dozvoli indeksiranje javnog sadržaja, zabrani
 *    privatne/API rute, uputi na sitemap.
 *  - TEST/PREVIEW (*.vercel.app): zabrani sve — sprečava duplikat sadržaja.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/novcanik",
        "/profil",
        "/poruke",
        "/nadzor",
        "/verifikacija",
        "/oauth",
        "/login",
        "/registracija",
        "/zaboravljena-lozinka",
        // Putanje sa tokenom u adresi. robots.txt nije zaštita — svaka od ovih
        // stranica nosi i `robots: noindex` u svojoj metadata — ali sprečava da
        // link, ako negde procuri, uopšte završi u redu za obilazak.
        "/reset-lozinka",
        "/dete-poziv",
        "/potvrdi-email",
        "/odjava-obavestenja",
        "/m/",
        // Prijavljeni deo koji je do sada bio izostavljen iz spiska.
        "/pocetna",
        "/sistem",
        // Javna je samo `/zadruge` (zbir po mestima); stranica zadruge traži prijavu.
        "/zadruge/",
        "/zrno",
        "/programi",
        "/donacije",
        "/glasanje",
        "/krug",
        "/doprinos-oglasi",
        "/prijatelji",
        "/deca",
        "/bagovi",
        "/dobrodosli",
        "/politika-prihvati",
        "/pravilnik-prihvati",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
