/**
 * Anonimizacija pseudonima posle prestanka statusa (Pravilnik čl. 55 st. 3; Politika
 * čl. 11 st. 8 i čl. 42 st. 6; Registar radnji obrade, evidencija doprinosa).
 *
 * Numerička istorija TRAJNO ostaje u evidenciji. Po isteku 10 godina od prestanka
 * statusa pseudonim uz zapise zamenjuje se oznakom koja ni posredno ne upućuje na
 * lice — zato oznaka NIJE izvedena ni iz internog id-a (za razliku od pseudonima
 * pri gašenju naloga, `obrisani-korisnik-<id>`), nego je slučajna.
 *
 * 🔴 Do tog roka prestanak statusa je PSEUDONIMIZACIJA, ne anonimizacija (Politika
 * čl. 42 st. 5) — ovaj rok se ne skraćuje i ne preskače.
 *
 * Bez Prisme.
 */

export const ROK_ANONIMIZACIJE_GODINA = 10;

/** Prefiks oznake anonimnog zapisa; ostatak je slučajan. */
export const PREFIKS_ANONIMNOG = "anonimno-";

/**
 * Trenutak prestanka statusa: gašenje naloga (`deaktiviranAt`), a za isključen
 * nalog koji nije ugašen — trenutak isključenja (`suspendedAt` uz `EXCLUDED`).
 * `null` kad status nije prestao ili trenutak nije zabeležen.
 */
export function trenutakPrestanka(u: {
  status: string;
  deaktiviranAt: Date | null;
  suspendedAt: Date | null;
}): Date | null {
  if (u.deaktiviranAt) return u.deaktiviranAt;
  if (u.status === "EXCLUDED") return u.suspendedAt;
  return null;
}

/** Najkasniji trenutak prestanka statusa čiji je rok istekao do `sada`. */
export function granicaAnonimizacije(sada: Date): Date {
  const g = new Date(sada);
  g.setUTCFullYear(g.getUTCFullYear() - ROK_ANONIMIZACIJE_GODINA);
  return g;
}

/** Da li je rok od 10 godina od prestanka statusa istekao. */
export function rokAnonimizacijeIstekao(
  u: { status: string; deaktiviranAt: Date | null; suspendedAt: Date | null },
  sada: Date,
): boolean {
  const t = trenutakPrestanka(u);
  return t !== null && t.getTime() <= granicaAnonimizacije(sada).getTime();
}

/** Oznaka anonimnog zapisa iz slučajnog niza (hex); ne nosi ništa o licu. */
export function oznakaAnonimnog(slucajno: string): string {
  return PREFIKS_ANONIMNOG + slucajno.toLowerCase();
}
