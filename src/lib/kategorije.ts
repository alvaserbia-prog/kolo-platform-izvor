// Kategorije Pijace — ravna lista 13 kategorija (slug vrednosti u bazi).
// Nazivi se prevode kroz i18n (messages/*, namespace "pijaca", ključ
// `kategorija_<slug sa _>`); u bazu ide isključivo slug.

export const KATEGORIJE = [
  "hrana-i-pice",
  "njiva-basta-zivotinje",
  "odeca-i-obuca",
  "pokucstvo-i-tehnika",
  "rucni-rad-i-pokloni",
  "za-decu",
  "popravke-i-gradjevina",
  "prevoz-i-dostava",
  "pomoc-u-kuci",
  "nega-zdravlje-lepota",
  "znanje-i-kreativa",
  "smestaj-i-prostor",
  "ostalo",
] as const;

export type Kategorija = (typeof KATEGORIJE)[number];

export function jeKategorija(v: string): v is Kategorija {
  return (KATEGORIJE as readonly string[]).includes(v);
}

// Slug → sufiks i18n ključa ("hrana-i-pice" → "hrana_i_pice").
// Nepoznata (legacy) vrednost pada na "ostalo" da prikaz nikad ne pukne.
export function kategorijaKljuc(slug: string): string {
  return (jeKategorija(slug) ? slug : "ostalo").replace(/-/g, "_");
}

const EMOJI: Record<Kategorija, string> = {
  "hrana-i-pice": "🥗",
  "njiva-basta-zivotinje": "🌱",
  "odeca-i-obuca": "👕",
  "pokucstvo-i-tehnika": "🛋️",
  "rucni-rad-i-pokloni": "🎁",
  "za-decu": "🧸",
  "popravke-i-gradjevina": "🔨",
  "prevoz-i-dostava": "🚚",
  "pomoc-u-kuci": "🧹",
  "nega-zdravlje-lepota": "🌿",
  "znanje-i-kreativa": "🎓",
  "smestaj-i-prostor": "🏠",
  "ostalo": "📦",
};

export function kategorijaEmoji(slug: string): string {
  return jeKategorija(slug) ? EMOJI[slug] : "📦";
}

// Srpski naziv kategorije za tekstove koji se generišu na serveru i NISU
// prevedeni — obaveštenja (zvonce, push, mejl). Isti tekst kao i18n ključ
// `pijaca.kategorija_<slug>` u messages/sr.json; UI i dalje čita iz i18n.
const NAZIV: Record<Kategorija, string> = {
  "hrana-i-pice": "Hrana i piće",
  "njiva-basta-zivotinje": "Njiva, bašta i životinje",
  "odeca-i-obuca": "Odeća i obuća",
  "pokucstvo-i-tehnika": "Pokućstvo i tehnika",
  "rucni-rad-i-pokloni": "Ručni rad i pokloni",
  "za-decu": "Za decu",
  "popravke-i-gradjevina": "Popravke i građevina",
  "prevoz-i-dostava": "Prevoz i dostava",
  "pomoc-u-kuci": "Pomoć u kući i čuvanje dece",
  "nega-zdravlje-lepota": "Nega, zdravlje i lepota",
  "znanje-i-kreativa": "Znanje i kreativne usluge",
  "smestaj-i-prostor": "Smeštaj i prostor",
  "ostalo": "Ostalo",
};

export function kategorijaNaziv(slug: string): string {
  return jeKategorija(slug) ? NAZIV[slug] : NAZIV["ostalo"];
}

// Parsira `?kat=slug1,slug2` u validiran spisak (bez duplikata, redosled taksonomije).
export function parsirajKatParam(param: string | null | undefined): Kategorija[] {
  if (!param) return [];
  const trazene = new Set(param.split(",").map((s) => s.trim()));
  return KATEGORIJE.filter((k) => trazene.has(k));
}
