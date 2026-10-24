/**
 * Adresa javnog profila.
 *
 * Od uvođenja pseudonima u adresu link glasi `/profil/Marko` umesto `/profil/<uuid>`.
 * Interni id i dalje radi (stari podeljeni linkovi, notifikacije zapisane u bazi),
 * pa je ovde samo izbor onoga što se PRIKAZUJE — kad pseudonim postoji, ide pseudonim.
 *
 * `encodeURIComponent` je tu zbog naloga sa starim pravilima (razmak, č/ć/š/ž/đ) —
 * novi pseudonimi su čist ASCII i kroz kodiranje prolaze nepromenjeni.
 *
 * VAŽNO: u sve što se ČUVA (link u notifikaciji, mejlu) ide id, ne pseudonim —
 * pseudonim se može promeniti, id ne može.
 */
export function profilHref(korisnik: {
  pseudonim?: string | null;
  id?: string | null;
}): string {
  const p = korisnik.pseudonim?.trim();
  if (p) return `/profil/${encodeURIComponent(p)}`;
  return `/profil/${korisnik.id ?? ""}`;
}
