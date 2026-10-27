import type { MetadataRoute } from "next";
import { absoluteUrl, hreflangAlternates } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

// Sitemap se osvežava na sat vremena — nov oglas tako uđe u indeks bez novog
// deploy-a, a baza se ne poziva na svaki zahtev robota.
export const revalidate = 3600;

// Gornja granica broja oglasa u sitemap-u. Standard dozvoljava 50.000 URL-ova
// po fajlu; ovoliko je daleko ispod, a čuva veličinu odgovora. Kad se pređe,
// treba podeliti sitemap na više fajlova (sitemap index).
const MAX_OGLASA = 5000;

/**
 * Javne stranice za sitemap. Autentifikovane (app) i API rute se NE navode —
 * one nisu za indeksiranje. `priority` je relativan unutar samog sajta.
 */
const JAVNE_PUTANJE: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/kako-funkcionise", priority: 0.9, changeFrequency: "monthly" },
  { path: "/vesti", priority: 0.6, changeFrequency: "weekly" },
  { path: "/cesto-postavljena-pitanja", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pijaca", priority: 0.7, changeFrequency: "daily" },
  // Mapa domaćih proizvođača (Pravilnik o gazdinstvima čl. 19) i spisak mesta sa
  // zadrugama — javni; profil zadruge traži prijavu i ovde se ne navodi.
  { path: "/gazdinstva", priority: 0.6, changeFrequency: "weekly" },
  { path: "/mapa", priority: 0.6, changeFrequency: "weekly" },
  { path: "/firme", priority: 0.5, changeFrequency: "weekly" },
  { path: "/zadruge", priority: 0.5, changeFrequency: "weekly" },
  // Sistem u brojkama — kartice i zbirovi, bez spiskova.
  { path: "/sistem", priority: 0.6, changeFrequency: "daily" },
  { path: "/podrzi-kolo", priority: 0.7, changeFrequency: "monthly" },
  { path: "/pokrovitelji", priority: 0.6, changeFrequency: "monthly" },
  { path: "/zajednicko-dobro", priority: 0.6, changeFrequency: "monthly" },
  { path: "/osnivacki-doprinos", priority: 0.5, changeFrequency: "monthly" },
  { path: "/whitepaper", priority: 0.5, changeFrequency: "yearly" },
  { path: "/pravilnik", priority: 0.5, changeFrequency: "monthly" },
  { path: "/statut", priority: 0.4, changeFrequency: "yearly" },
  { path: "/uslovi", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privatnost", priority: 0.4, changeFrequency: "yearly" },
  { path: "/dpia", priority: 0.3, changeFrequency: "yearly" },
  { path: "/radnje-obrade", priority: 0.3, changeFrequency: "yearly" },
  { path: "/rizici", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticne: MetadataRoute.Sitemap = JAVNE_PUTANJE.map(({ path, priority, changeFrequency }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
    // hreflang varijante (sr default + /en, /hu, /sr-Cyrl) — Google čita iz sitemap-a.
    alternates: {
      languages: Object.fromEntries(
        Object.entries(hreflangAlternates(path)).map(([k, v]) => [k, absoluteUrl(v)]),
      ),
    },
  }));

  // Aktivni oglasi. Stranica oglasa je javna (Uslovi čl. 17 st. 2) i ima svoj
  // naslov, opis i OG sliku — bez ovoga je Gugl nije mogao naći, jer se do nje
  // stizalo samo preko liste na /pijaca. Ovo je jedini stalan izvor priliva
  // ljudi koji traže konkretnu stvar.
  //
  // Bez hreflang varijanti: sadržaj oglasa piše korisnik i ne prevodi se.
  //
  // Ako baza nije dostupna (npr. build bez DATABASE_URL), sitemap se svodi na
  // statične stranice umesto da obori build.
  let oglasi: MetadataRoute.Sitemap = [];
  try {
    const listings = await prisma.marketplaceListing.findMany({
      // Oglas maloletnog korisnika se ne indeksira (Pravilnik o učešću dece čl. 24 st. 2) —
      // on nije javno dostupan, pa u sitemap-u nema šta da traži.
      where: { status: "ACTIVE", seller: { maloletan: false } },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: MAX_OGLASA,
    });
    oglasi = listings.map((l) => ({
      url: absoluteUrl(`/pijaca/${l.id}`),
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("[sitemap] oglasi nisu učitani", e);
  }

  // Profili odobrenih gazdinstava — javni kao i mapa (Pravilnik o gazdinstvima
  // čl. 19). Gazdinstvo koje nije odobreno nema javni profil.
  let gazdinstva: MetadataRoute.Sitemap = [];
  try {
    const lista = await prisma.gazdinstvo.findMany({
      where: { status: "ODOBRENO" },
      select: { id: true, updatedAt: true },
    });
    gazdinstva = lista.map((g) => ({
      url: absoluteUrl(`/gazdinstva/${g.id}`),
      lastModified: g.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch (e) {
    console.error("[sitemap] gazdinstva nisu učitana", e);
  }

  return [...staticne, ...oglasi, ...gazdinstva];
}
