/**
 * Jedna mapa za gazdinstva i pokrovitelje — ČISTA pravila (bez Prisme, bez Leaflet-a).
 *
 * Osnov: Pravilnik o gazdinstvima čl. 19 st. 2 („Na istoj mapi prikazuju se i
 * pokrovitelji"), Pravilnik o pokroviteljstvu i donacijama čl. 26 st. 2 (pokrovitelj
 * na mapi: naziv, logotip, mesto i adresa, uz ponudu vaučera — ništa drugo).
 *
 * 🔴 Tačka nosi samo ono što akti dozvoljavaju: naziv, mesto, adresu (gazdinstvo —
 * samo uz izjavu; pokrovitelj — uz izjavu iz upisa), logotip pokrovitelja, oznaku
 * DOMAĆE i broj slobodnih vaučera. Nikad BPG, MB, PIB, imena članova ni POEN.
 */

/** Od kog zuma se iznad tačke ispisuje naziv (bliže od ovoga — samo na dodir/klik). */
export const LABELA_OD_ZUMA = 13;

/** Poluprečnik grupisanja tačaka u pikselima ekrana. */
export const POLUPRECNIK_GRUPE_PX = 44;

export type FilterMape = "SVE" | "GAZDINSTVA" | "FIRME";

export type TackaMape = {
  id: string;
  vrsta: "GAZDINSTVO" | "POKROVITELJ";
  naziv: string;
  mesto: string;
  /** Adresa — samo uz izjavu o prikazu adrese; inače `null`. */
  adresa: string | null;
  lat: number;
  lng: number;
  /** Logotip — samo pokrovitelj (čl. 26 st. 2). */
  logoUrl: string | null;
  /** Oznaka DOMAĆE — oglasi odobrenog gazdinstva (Pravilnik o gazdinstvima čl. 18 st. 2, `jeDomace`). */
  domace: boolean;
  /** Upis pokrovitelja čiji su vaučeri ponuđeni (za vezu „Vaučeri"); `null` bez upisa. */
  upisId: string | null;
  /** Broj slobodnih vaučera važećih ugovora — 🔴 nikad POEN ni dinari. */
  vauceri: number;
};

/**
 * Sastavlja tačke mape. Pokrovitelj upisan iz gazdinstva (upis vezan za gazdinstvo
 * koje je na mapi) ne dobija drugu tačku na istom mestu: njegovi vaučeri idu uz
 * tačku gazdinstva.
 */
export function sastaviTacke(
  gazdinstva: { id: string; naziv: string; naselje: string; adresa: string | null; lat: number; lng: number }[],
  pokrovitelji: {
    id: string;
    naziv: string;
    logoUrl: string | null;
    mesto: string;
    adresa: string | null;
    lat: number;
    lng: number;
    vauceri: number;
    gazdinstvoId: string | null;
  }[],
): TackaMape[] {
  const naMapi = new Set(gazdinstva.map((g) => g.id));
  const uzGazdinstvo = new Map<string, { upisId: string; vauceri: number }>();
  for (const p of pokrovitelji) {
    if (p.gazdinstvoId && naMapi.has(p.gazdinstvoId)) uzGazdinstvo.set(p.gazdinstvoId, { upisId: p.id, vauceri: p.vauceri });
  }
  return [
    ...gazdinstva.map((g) => ({
      id: g.id,
      vrsta: "GAZDINSTVO" as const,
      naziv: g.naziv,
      mesto: g.naselje,
      adresa: g.adresa,
      lat: g.lat,
      lng: g.lng,
      logoUrl: null,
      domace: true,
      upisId: uzGazdinstvo.get(g.id)?.upisId ?? null,
      vauceri: uzGazdinstvo.get(g.id)?.vauceri ?? 0,
    })),
    ...pokrovitelji
      .filter((p) => !(p.gazdinstvoId && naMapi.has(p.gazdinstvoId)))
      .map((p) => ({
        id: p.id,
        vrsta: "POKROVITELJ" as const,
        naziv: p.naziv,
        mesto: p.mesto,
        adresa: p.adresa,
        lat: p.lat,
        lng: p.lng,
        logoUrl: p.logoUrl,
        domace: false,
        upisId: p.id,
        vauceri: p.vauceri,
      })),
  ];
}

export function filtriraj(tacke: TackaMape[], filter: FilterMape): TackaMape[] {
  if (filter === "GAZDINSTVA") return tacke.filter((t) => t.vrsta === "GAZDINSTVO");
  if (filter === "FIRME") return tacke.filter((t) => t.vrsta === "POKROVITELJ");
  return tacke;
}

/**
 * Grupisanje tačaka po blizini na ekranu (pohlepno, redom): tačka ulazi u prvu
 * grupu čiji je začetnik bliži od `poluprecnik` piksela, inače otvara novu.
 * Ulaz su koordinate u pikselima za trenutni zum.
 */
export function grupisi<T extends { x: number; y: number }>(tacke: T[], poluprecnik = POLUPRECNIK_GRUPE_PX): T[][] {
  const grupe: { x: number; y: number; clanovi: T[] }[] = [];
  const r2 = poluprecnik * poluprecnik;
  for (const t of tacke) {
    const g = grupe.find((x) => (x.x - t.x) ** 2 + (x.y - t.y) ** 2 <= r2);
    if (g) g.clanovi.push(t);
    else grupe.push({ x: t.x, y: t.y, clanovi: [t] });
  }
  return grupe.map((g) => g.clanovi);
}

/** Da li se naziv ispisuje iznad tačke na datom zumu. */
export function prikaziLabelu(zum: number): boolean {
  return zum >= LABELA_OD_ZUMA;
}

/** Veza ka Pijaci filtriranoj na oglase u ime gazdinstva (samo gazdinstvo). */
export function pijacaHref(t: TackaMape): string | null {
  return t.vrsta === "GAZDINSTVO" ? `/pijaca?gazdinstvo=${encodeURIComponent(t.id)}` : null;
}

/** Veza ka ponudi vaučera pokrovitelja na ekranu Vaučeri. */
export function vauceriHref(t: TackaMape): string | null {
  return t.upisId ? `/vauceri?upis=${encodeURIComponent(t.upisId)}` : null;
}
