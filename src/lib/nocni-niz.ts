import { NOCNI_NIZ, ROK_KORAKA_MS } from "@/lib/nocni-niz-pravila";

export { NOCNI_NIZ } from "@/lib/nocni-niz-pravila";

export interface IshodKoraka {
  putanja: string;
  status: number | null;
  greska?: string;
}

/**
 * Pokreće korake ponoćnog niza REDOM, svaki kao zaseban poziv sopstvene rute (Vercel Cron
 * zaglavlje `Authorization: Bearer`). Ne baca: neuspeh jednog koraka se beleži i niz ide dalje.
 */
export async function pokreniNocniNiz(osnova: string): Promise<IshodKoraka[]> {
  const tajna = process.env.CRON_SECRET;
  const ishodi: IshodKoraka[] = [];
  if (!tajna) return ishodi;
  for (const putanja of NOCNI_NIZ) {
    try {
      const odgovor = await fetch(new URL(putanja, osnova), {
        headers: { authorization: `Bearer ${tajna}` },
        signal: AbortSignal.timeout(ROK_KORAKA_MS),
        cache: "no-store",
      });
      ishodi.push({ putanja, status: odgovor.status });
      if (!odgovor.ok) console.error(`[NOĆNI NIZ] ${putanja} → ${odgovor.status}`);
    } catch (e) {
      ishodi.push({ putanja, status: null, greska: String(e) });
      console.error(`[NOĆNI NIZ] ${putanja} nije završen:`, e);
    }
  }
  console.log("[NOĆNI NIZ]", JSON.stringify(ishodi));
  return ishodi;
}

/** Adresa na kojoj se koraci pozivaju: produkcijski domen, inače adresa samog zahteva. */
export function osnovaNiza(urlZahteva: string): string {
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return prod ? `https://${prod}` : new URL(urlZahteva).origin;
}
