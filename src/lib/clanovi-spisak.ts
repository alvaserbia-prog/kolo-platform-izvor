/**
 * Ko ulazi u spisak članova — na `/sistem` (kartice Članovi i Lokacije) i na
 * `/zadruge`. Jedan uslov na jednom mestu, da isti grad ne bi na dva ekrana
 * imao dva broja (pravilo „ekran nije poslednja reč").
 *
 * Nezavršeni OAuth nalozi (privremeni pseudonim „korisnik_…") i
 * deaktivirani/neaktivni nalozi ne ulaze — stanje se meri nad onim što je živo
 * (`docs/merenje-stanja.md`).
 */
export const USLOV_CLANA_U_SPISKU = {
  oauthPending: false,
  deaktiviranAt: null,
  status: "ACTIVE",
} as const;
