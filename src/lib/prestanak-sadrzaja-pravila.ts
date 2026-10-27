/**
 * Šta se pri prestanku statusa briše iz slobodnog teksta i opisa — ČISTA pravila
 * (bez Prisme). Sprovodi ih `protokol/prestanak-sadrzaja.ts`.
 *
 * Izvor: Politika čl. 42 st. 2, čl. 29 st. 3, čl. 30 st. 5, čl. 32 st. 7, čl. 38 st. 4;
 * Pravilnik čl. 55 st. 2 (opis zapisa koji sadrži podatak o ličnosti briše se
 * prestankom statusa, a zapis ostaje — iznos, strane, vreme i vrsta se ne menjaju).
 */

/**
 * Vrste zapisa čiji opis nosi podatak o ličnosti (Politika čl. 29 st. 3): opis
 * dobra, odnosno usluge i naziv davaoca uz vaučer mogu otkriti podatke o licu,
 * uključujući podatke o zdravlju. Pri prestanku statusa imaoca briše se opis
 * (`description`, `opisKljuc`, `opisParametri`); zapis ostaje.
 *
 * 🔴 Lista je zatvorena: opis emisije Protokola (osnov upisa) je namerno javan
 * i NE briše se (Politika čl. 42 st. 5). Nova vrsta ide ovde samo kad njen opis
 * sadrži podatak o ličnosti.
 */
export const TIPOVI_OPISA_SA_PODATKOM_O_LICNOSTI = ["PONISTENJE_VAUCER", "ISPRAVKA_VAUCER"] as const;

/**
 * Prijava lažnog roditeljstva koju je podneo nalog čiji status prestaje
 * (Politika čl. 38 st. 4, čl. 42 st. 2): prijava, zaustavljanje i odluka čuvaju
 * se dok postoji nalog maloletnog korisnika; opis (slobodan tekst) se briše odmah.
 */
export function sudbinaPrijaveRoditeljstva(deteNalogPostoji: boolean): "OBRISI" | "ZADRZI_BEZ_OPISA" {
  return deteNalogPostoji ? "ZADRZI_BEZ_OPISA" : "OBRISI";
}
