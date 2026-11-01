// Više mesta — oglas na Pijaci i ugovor o pokroviteljstvu dobrima i uslugama.
//
// Prvo mesto ostaje u postojećoj koloni (`MarketplaceListing.location`, odnosno
// `UgovorDobra.mesto`/`adresaPredaje`), a dodatna su u nizovima. Svaki prikaz i
// svaki filter po mestu čita SVA mesta kroz ove funkcije — inače oglas ili vaučer
// „nestaje" iz drugog mesta (CLAUDE.md pravilo 14: ekran nije poslednja reč).
//
// Čista pravila, bez Prisme — uvozi ih i pretraživač.

/** Oglas na Pijaci: najviše tri mesta (prvo + dva dodatna). */
export const MAX_MESTA_OGLASA = 3;

/**
 * Ugovor o dobrima i uslugama: najviše pet mesta predaje, odnosno pružanja
 * (donacije čl. 28 st. 2 t. 5, set 5.0.6). Broj je tehnička granica obrasca, ne akta.
 */
export const MAX_MESTA_PREDAJE = 5;

/** Sva mesta oglasa, redom, bez praznih i bez ponavljanja. */
export function mestaOglasa(o: { location: string | null; dodatnaMesta?: string[] | null }): string[] {
  const sva = [o.location, ...(o.dodatnaMesta ?? [])]
    .map((m) => (m ?? "").trim())
    .filter(Boolean);
  return [...new Set(sva)];
}

export type MestoPredaje = { mesto: string; adresa: string | null };

/** Sva mesta predaje, odnosno pružanja iz ugovora — prvo je `mesto`/`adresaPredaje`. */
export function mestaPredaje(u: {
  mesto: string;
  adresaPredaje: string | null;
  dodatnaMestaPredaje?: string[] | null;
  dodatneAdresePredaje?: string[] | null;
}): MestoPredaje[] {
  const dodatna = (u.dodatnaMestaPredaje ?? []).map((mesto, i) => ({
    mesto,
    adresa: u.dodatneAdresePredaje?.[i] || null,
  }));
  return [{ mesto: u.mesto, adresa: u.adresaPredaje }, ...dodatna].filter((m) => m.mesto.trim());
}

/** „Sombor, Glavna 1" — jedno mesto predaje u tekstu. */
export function prikazMestaPredaje(m: MestoPredaje): string {
  return m.adresa ? `${m.mesto}, ${m.adresa}` : m.mesto;
}

/**
 * Dodatna mesta posle provere: svako mesto razrešava pozivalac (`razresi`, u praksi
 * `razresiNaselje`), prazna se preskaču, ponovljena (i prvo mesto) se izbacuju.
 * `null` = neko mesto nije iz šifarnika.
 */
export function procitajDodatnaMesta(
  unos: unknown[],
  prvo: string | null,
  max: number,
  razresi: (v: unknown) => string | null,
): string[] | null {
  const rezultat: string[] = [];
  for (const u of unos) {
    if (typeof u !== "string" || !u.trim()) continue;
    const m = razresi(u);
    if (!m) return null;
    if (m === prvo || rezultat.includes(m)) continue;
    rezultat.push(m);
  }
  return rezultat.slice(0, Math.max(0, max - 1));
}
