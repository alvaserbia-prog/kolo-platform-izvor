/**
 * ZRNO i Gornje Kolo po statusu učesnika (set 4.8.2) — čista pravila, bez Prisme.
 *
 * Servisni ulaz je `src/lib/protokol/zrno.ts`, koji ove funkcije re-eksportuje
 * (CLAUDE.md pravilo 9).
 *
 *  - ZRNO upisuje član Kola i član bez potvrde; korisnik ne upisuje (Pravilnik
 *    čl. 19 st. 2, 28a). Član bez potvrde upisom NE postaje čuvar Kola.
 *  - Aktivira samo čuvar Kola (Pravilnik čl. 20 st. 2–3, 29 st. 3).
 *  - Slobodno ZRNO otpisuje čuvar Kola i član bez potvrde; korisniku je ZRNO
 *    zamrznuto — ne aktivira ga, ne otpisuje ga, ne delegira (Pravilnik čl. 20,
 *    21, 30 st. 3).
 *  - Gornje Kolo čine čuvari Kola sa aktiviranim ZRNOM; sastav se utvrđuje za
 *    svaki obračunski period (dan) posebno (Pravilnik čl. 45; Gornje Kolo čl. 4, 6).
 *  - Delegira samo čuvar Kola, i to samo drugom čuvaru Kola (Pravilnik čl. 47;
 *    Gornje Kolo čl. 14). Delegacija čiji delegator ili delegat nije čuvar ne
 *    proizvodi dejstvo: moć iz nje se ne računa nikome, dok status ne bude vraćen.
 *
 * 🔴 Status se uvek čita iz `statusUcesnika` (`status-ucesnika-pravila.ts`), nikad
 * iz same kolone `tipKorisnika`: član bez potvrde sa ZRNOM je `REGULARNI`, a
 * korisnik kome je pala verifikacija je `NEVERIFIKOVAN` iako mu ZRNO ostaje upisano.
 */
import { jeCuvar, sme, type StatusUcesnika } from "@/lib/status-ucesnika-pravila";

/** Glasačka moć: ⌊√(aktivna ZRNA)⌋ (Pravilnik čl. 46; Gornje Kolo čl. 5). */
export function glasackaMoc(aktivno: number): number {
  if (aktivno <= 0) return 0;
  return Math.floor(Math.sqrt(aktivno));
}

/** Upis ZRNA: član bez potvrde, član Kola, čuvar Kola, osnivač (Pravilnik čl. 19 st. 2). */
export const smeUpisatiZrno = (s: StatusUcesnika): boolean => sme("ZRNO_UPIS", s);

/** Aktiviranje ZRNA: samo čuvar Kola (Pravilnik čl. 20 st. 2, 29 st. 3). */
export const smeAktiviratiZrno = (s: StatusUcesnika): boolean => sme("ZRNO_AKTIVIRANJE", s);

/** Otpis slobodnog ZRNA: čuvar Kola i član bez potvrde; korisniku zamrznuto (čl. 20, 21, 30 st. 3). */
export const smeOtpisatiZrno = (s: StatusUcesnika): boolean => sme("ZRNO_OTPIS", s);

/** Vraćanje aktivnog ZRNA u slobodno na zahtev: čuvar Kola (čl. 20 st. 3). */
export const smeOtkljucatiZrno = (s: StatusUcesnika): boolean => jeCuvar(s);

/** Delegiranje: i delegator i delegat su čuvari Kola (Pravilnik čl. 47; Gornje Kolo čl. 14). */
export function smeDelegirati(delegator: StatusUcesnika, delegat: StatusUcesnika): boolean {
  return sme("DELEGIRANJE", delegator) && sme("DELEGIRANJE", delegat);
}

/**
 * Glas i predlog u Gornjem Kolu: čuvar Kola sa najmanje jednim aktivnim ZRNOM
 * (Pravilnik čl. 45, 46; Gornje Kolo čl. 4, 10).
 */
export function smeUGornjeKolo(s: StatusUcesnika, aktivno: number): boolean {
  return sme("GLAS", s) && aktivno > 0;
}

/**
 * Položaj ZRNA koji se objašnjava na ekranu (ključ u namespace-u `zrno`):
 *  - `zamrznuto` — korisnik kome je upisano ZRNO (Pravilnik čl. 30 st. 3);
 *  - `bez_potvrde` — član bez potvrde kome je upisano ZRNO (čl. 28a);
 *  - `null` — ništa posebno (čuvar, član Kola bez ZRNA, korisnik bez ZRNA).
 */
export function polozajZrna(s: StatusUcesnika, upisano: number): "zamrznuto" | "bez_potvrde" | null {
  if (upisano <= 0) return null;
  if (s === "KORISNIK") return "zamrznuto";
  if (s === "CLAN_BEZ_POTVRDE") return "bez_potvrde";
  return null;
}

export type ClanSastava = { userId: string; aktivno: number; moc: number };

/**
 * Sastav Gornjeg Kola za obračunski period: čuvari Kola sa `aktivno > 0`
 * (Pravilnik čl. 45 st. 2; Gornje Kolo čl. 4 st. 1–2). Ko nije čuvar — član bez
 * potvrde sa ZRNOM, korisnik kome je ZRNO zamrznuto, dete — nije u sastavu ni
 * kad mu je aktivno ZRNO još zatečeno do kraja perioda.
 *
 * Sastav se ne čuva kao zapis (otvoreno pitanje 3): ZRNO i delegiranje se menjaju
 * samo u ponoć, glas nosi moć perioda u kome je dat (`GlasanjeGlas.glasackaGlasova`),
 * a status se proverava i pri davanju glasa.
 */
export function sastavGornjegKola(
  stanja: readonly { userId: string; aktivno: number }[],
  statusi: ReadonlyMap<string, StatusUcesnika>,
): ClanSastava[] {
  const out: ClanSastava[] = [];
  for (const s of stanja) {
    const st = statusi.get(s.userId);
    if (!st || !smeUGornjeKolo(st, s.aktivno)) continue;
    out.push({ userId: s.userId, aktivno: s.aktivno, moc: glasackaMoc(s.aktivno) });
  }
  return out;
}

/**
 * Glasačka moć sa tranzitivnim lancem delegiranja (Gornje Kolo čl. 14–15).
 *
 * `next`: delegator → delegat (samo važeće delegacije). `baza`: userId → sopstvena
 * kvadratna moć. Vraća ukupnu moć kojom `userId` glasa:
 *  - ako je `userId` delegirao (ima izlaznu vezu) → 0;
 *  - inače: sopstvena moć + moć svih čiji se lanac (tranzitivno) završava na njemu;
 *  - lanci koji upadnu u krug ne doprinose nikome (krug = nevažeće).
 *
 * Kad je dat `cuvari` (set 4.8.2): moć ima samo čuvar Kola, a lanac koji prolazi
 * kroz nekoga ko nije čuvar ne proizvodi dejstvo — moć iz njega se ne računa
 * nikome (Gornje Kolo čl. 14; Pravilnik čl. 30 st. 3, 47).
 */
export function razresiGlasackuMoc(
  next: ReadonlyMap<string, string>,
  baza: ReadonlyMap<string, number>,
  userId: string,
  cuvari?: ReadonlySet<string>,
): number {
  if (next.has(userId)) return 0;
  const jeC = (id: string) => !cuvari || cuvari.has(id);
  if (!jeC(userId)) return 0;

  const resolve = (h: string): string | null => {
    const seen = new Set<string>();
    let cur = h;
    while (next.has(cur)) {
      if (seen.has(cur)) return null; // krug → nevažeće
      if (!jeC(cur)) return null; // delegator nije čuvar → bez dejstva
      seen.add(cur);
      cur = next.get(cur)!;
    }
    return jeC(cur) ? cur : null; // delegat nije čuvar → bez dejstva
  };

  let total = jeC(userId) ? (baza.get(userId) ?? 0) : 0;
  for (const delegator of next.keys()) {
    if (delegator !== userId && resolve(delegator) === userId) {
      total += baza.get(delegator) ?? 0;
    }
  }
  return total;
}
