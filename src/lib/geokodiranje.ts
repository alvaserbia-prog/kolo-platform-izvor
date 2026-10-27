import { lokacijaUSrbiji } from "@/lib/gazdinstvo-pravila";

/**
 * Pretraga adrese → tačka na mapi, za prijavu gazdinstva (Politika privatnosti
 * čl. 25, Registar radnji obrade br. 20).
 *
 * Upit ide iz pretraživača korisnika pravo servisu za pretragu adresa
 * OpenStreetMap-a (Nominatim), ne preko našeg servera. Adresa se od seta 4.7.5
 * čuva uz prijavu (gazdinstva čl. 5 st. 1 t. 3), ali je vidi samo administratorski tim — u javni
 * prikaz ne ide (brana `gazdinstvo-izvor.test.ts`).
 *
 * Pravila korišćenja Nominatim-a: najviše jedan upit u sekundi i bez pretrage
 * na svaki otkucaj — zato se poziva samo na dugme, ne dok korisnik kuca.
 */
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export type Tacka = { lat: number; lng: number };

export async function nadjiAdresu(adresa: string, naselje: string): Promise<Tacka | null> {
  const upit = [adresa.trim(), naselje.trim()].filter(Boolean).join(", ");
  if (!upit) return null;
  const url = `${NOMINATIM}?format=jsonv2&limit=1&countrycodes=rs&accept-language=sr-Latn&q=${encodeURIComponent(upit)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const nadjeno = (await res.json()) as { lat?: string; lon?: string }[];
  const prvo = nadjeno[0];
  if (!prvo?.lat || !prvo?.lon) return null;
  const tacka = { lat: Number(prvo.lat), lng: Number(prvo.lon) };
  return lokacijaUSrbiji(tacka.lat, tacka.lng) ? tacka : null;
}
