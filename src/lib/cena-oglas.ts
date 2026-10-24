// Cena oglasa na Pijaci ima tri varijante koje bira oglašivač:
//   FIKSNA  → jedan iznos (price)
//   RASPON  → od–do (price = donja granica, cenaDo = gornja granica)
//   DOGOVOR → bez iznosa, „po dogovoru" (price = cenaDo = null)
// Ovaj modul je čist (bez React/Prisma zavisnosti) — koristi se i na serveru i na klijentu.

export type CenaTip = "FIKSNA" | "RASPON" | "DOGOVOR";

export const MAX_CENA = 1_000_000_000;

export interface CenaPolja {
  cenaTip: CenaTip | string;
  price: number | null;
  cenaDo: number | null;
}

// Glavni deo prikaza cene (bez „POEN" oznake). Za DOGOVOR vraća prosleđenu labelu.
export function formatCenaGlavni(
  c: CenaPolja,
  poDogovoruLabel: string,
  locale = "sr-RS",
): string {
  if (c.cenaTip === "DOGOVOR" || c.price == null) return poDogovoruLabel;
  if (c.cenaTip === "RASPON" && c.cenaDo != null) {
    return `${c.price.toLocaleString(locale)}–${c.cenaDo.toLocaleString(locale)}`;
  }
  return c.price.toLocaleString(locale);
}

// Da li uz cenu prikazati jedinicu (POEN). Za „po dogovoru" se ne prikazuje.
export function prikaziJedinicuCene(c: CenaPolja): boolean {
  return !(c.cenaTip === "DOGOVOR" || c.price == null);
}

export interface CenaParseRezultat {
  ok: boolean;
  error?: string;
  cenaTip: CenaTip;
  price: number | null;
  cenaDo: number | null;
}

function greska(error: string): CenaParseRezultat {
  return { ok: false, error, cenaTip: "FIKSNA", price: null, cenaDo: null };
}

// Validira i normalizuje cenu iz forme (POST/PATCH). Vrednost se uvek svodi na
// ceo broj. `cenaTipRaw` koji nedostaje tretira se kao FIKSNA (kompatibilnost).
export function parsirajCenu(
  cenaTipRaw: string | null | undefined,
  priceRaw: string | null | undefined,
  cenaDoRaw: string | null | undefined,
): CenaParseRezultat {
  const tip = (cenaTipRaw ?? "FIKSNA").toUpperCase();

  if (tip === "DOGOVOR") {
    return { ok: true, cenaTip: "DOGOVOR", price: null, cenaDo: null };
  }

  if (tip === "RASPON") {
    const od = Math.floor(Number(priceRaw));
    const doCena = Math.floor(Number(cenaDoRaw));
    if (!priceRaw || isNaN(od) || od <= 0 || od > MAX_CENA)
      return greska("Donji iznos mora biti pozitivan ceo broj.");
    if (!cenaDoRaw || isNaN(doCena) || doCena <= 0 || doCena > MAX_CENA)
      return greska("Gornji iznos mora biti pozitivan ceo broj.");
    if (doCena <= od)
      return greska("Gornji iznos mora biti veći od donjeg.");
    return { ok: true, cenaTip: "RASPON", price: od, cenaDo: doCena };
  }

  // FIKSNA (default)
  const p = Math.floor(Number(priceRaw));
  if (!priceRaw || isNaN(p) || p <= 0)
    return greska("Iznos mora biti pozitivan ceo broj.");
  if (p > MAX_CENA)
    return greska("Iznos je neuobičajeno velik.");
  return { ok: true, cenaTip: "FIKSNA", price: p, cenaDo: null };
}
