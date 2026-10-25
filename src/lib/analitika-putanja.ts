/**
 * Šta od adrese stranice sme da ode u analitiku (Google Analytics, Vercel).
 *
 * Čista funkcija, bez DOM-a — uvozi je i klijent i test.
 *
 * ─── 🔴 Zašto ovo postoji (26.09.2026) ─────────────────────────────────────
 *
 * GA uz svaki pregled šalje CELU adresu. Pre ovoga su tako Google-u odlazili:
 *  - TAJNI TOKENI iz putanje (`/reset-lozinka/<token>`, `/potvrdi-email/<token>`,
 *    `/odjava-obavestenja/<token>`, `/dete-poziv/<token>`) — link za reset lozinke
 *    kod trećeg lica je ključ od tuđeg naloga;
 *  - PSEUDONIMI (`/profil/<pseudonim>`, `?plati=<pseudonim>`) — podatak ko je
 *    čiji profil gledao, a pseudonim u evidenciji sme da vidi samo potvrđen član
 *    (Pravilnik čl. 67), ne Google.
 *
 * Zato se dinamički deo putanje svodi na šablon, a upit (`?…`) se odbacuje ceo,
 * osim `utm_*` oznaka kampanje — bez njih se ne vidi odakle je ko došao.
 *
 * `null` znači: ova stranica se ne meri uopšte (admin, nadzor, dečji prostor,
 * potvrde programa podrške).
 */

/** Rute koje se ne mere — ni pregled, ni događaj. Poređenje po prefiksu segmenta. */
export const RUTE_BEZ_MERENJA = [
  "/admin",
  "/nadzor",
  // Dečji prostor: dete mlađe od 15 ne može samo da da pristanak (ZZPL čl. 16),
  // a DPIA obećava da podaci maloletnih ostaju u EU.
  "/deca",
  "/dete-poziv",
  "/registracija/dete",
  "/prijatelji",
  "/kutija-zelja",
  // Potvrda tuđe prijave na program podrške — sam ulazak otkriva da neko iz
  // lanca traži podršku (posebna kategorija, Politika čl. 6).
  "/programi/potvrde",
] as const;

/**
 * Šabloni dinamičkih ruta. Redosled je bitan: prvi pogodak pobeđuje.
 * `izuzeci` su statičke podrute istog oblika (npr. `/profil/oglasi`).
 */
const SABLONI: { prefiks: string; sablon: string; izuzeci?: string[] }[] = [
  { prefiks: "/profil", sablon: "/profil/[pseudonim]", izuzeci: ["oglasi"] },
  { prefiks: "/m", sablon: "/m/[hash]" },
  { prefiks: "/reset-lozinka", sablon: "/reset-lozinka/[token]" },
  { prefiks: "/potvrdi-email", sablon: "/potvrdi-email/[token]" },
  { prefiks: "/odjava-obavestenja", sablon: "/odjava-obavestenja/[token]" },
  { prefiks: "/pijaca", sablon: "/pijaca/[id]", izuzeci: ["novi-oglas"] },
  { prefiks: "/doprinos-oglasi", sablon: "/doprinos-oglasi/[id]" },
  { prefiks: "/nabavke", sablon: "/nabavke/[id]" },
  { prefiks: "/donacije", sablon: "/donacije/[id]" },
];

/**
 * Segment koji liči na identifikator (cuid, uuid, dug heks ili token) svodi se na
 * `[id]` i kad ga nijedan šablon ne pokriva — brana za rutu dodatu posle ovog fajla.
 */
const LICI_NA_ID = /^(?:c[a-z0-9]{20,}|[0-9a-f-]{16,}|[A-Za-z0-9_-]{24,})$/;

function prefiksPogadja(putanja: string, prefiks: string): boolean {
  return putanja === prefiks || putanja.startsWith(`${prefiks}/`);
}

/** Putanja bez upita, svedena na šablon; `null` = ne meriti. */
export function ocistiPutanju(pathname: string): string | null {
  let p = pathname.split("?")[0].split("#")[0] || "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  if (RUTE_BEZ_MERENJA.some((r) => prefiksPogadja(p, r))) return null;

  const delovi = p.split("/"); // ["", "profil", "x", ...]
  for (const s of SABLONI) {
    if (!prefiksPogadja(p, s.prefiks) || p === s.prefiks) continue;
    const dubina = s.prefiks.split("/").length; // segment odmah posle prefiksa
    const segment = delovi[dubina];
    if (s.izuzeci?.includes(segment)) break;
    const ostatak = delovi.slice(dubina + 1).map((d) => (LICI_NA_ID.test(d) ? "[id]" : d));
    return [s.sablon, ...ostatak].join("/");
  }

  return delovi.map((d) => (LICI_NA_ID.test(d) ? "[id]" : d)).join("/") || "/";
}

/** Iz upita zadržava samo `utm_*` oznake kampanje; sve ostalo se odbacuje. */
export function ocistiUpit(search: string): string {
  const ulaz = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const izlaz = new URLSearchParams();
  for (const [k, v] of ulaz) {
    if (/^utm_[a-z_]+$/.test(k)) izlaz.append(k, v.slice(0, 100));
  }
  const s = izlaz.toString();
  return s ? `?${s}` : "";
}

/**
 * Cela adresa za analitiku: izvor + očišćena putanja + dozvoljen upit.
 * `null` = ne meriti. Adresa sa drugog sajta vraća se samo kao izvor (referrer).
 */
export function ocistiAdresu(url: string, izvor: string): string | null {
  let u: URL;
  try {
    u = new URL(url, izvor);
  } catch {
    return null;
  }
  if (u.origin !== new URL(izvor).origin) return u.origin;
  const put = ocistiPutanju(u.pathname);
  return put === null ? null : `${u.origin}${put}${ocistiUpit(u.search)}`;
}
