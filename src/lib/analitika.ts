/**
 * Jedini ulaz za slanje događaja u Google Analytics.
 *
 * Svaki poziv je NO-OP kad GA nije učitan — a nije učitan bez pristanka, van
 * produkcije, za maloletni nalog i na rutama bez merenja (vidi `Analitika.tsx`
 * i `analitika-putanja.ts`). Pozivno mesto zato ne proverava ništa samo.
 *
 * ─── 🔴 Šta NIKAD ne ide u GA ──────────────────────────────────────────────
 *  - pseudonim, id naloga, email, `user_id` — Fondacija ne drži vezu pseudonima
 *    i identiteta (Pravilnik čl. 31), pa je ne sme dati ni Google-u;
 *  - iznos POEN-a ili dinara, `value`/`currency` — broj uz POEN u alatu za
 *    merenje prodaje čita se kao novčana vrednost (Pravilnik čl. 13);
 *  - naziv socijalnog programa ili njegov osnov (posebna kategorija, Politika čl. 6).
 *
 * Zato parametri prolaze kroz DOZVOLJENU listu imena, a vrednost mora biti kratka
 * oznaka iz koda (mala slova, cifre, `_`, `-`). Brana: `analitika-izvor.test.ts`.
 */

export type ImeDogadjaja =
  | "sign_up"
  | "oglas_objavljen"
  | "kontakt_oglasivaca"
  | "prepis_poen"
  | "potvrda_data"
  | "donacija_zapoceta";

/** Jedina imena parametara koja smeju uz događaj. */
export const DOZVOLJENI_PARAMETRI = ["method", "tip", "kategorija", "izvor", "kanal"] as const;
type ImeParametra = (typeof DOZVOLJENI_PARAMETRI)[number];

const OZNAKA = /^[a-z0-9_-]{1,40}$/;

type GtagFn = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

export function dogadjaj(ime: ImeDogadjaja, parametri?: Partial<Record<ImeParametra, string>>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const cisto: Record<string, string> = {};
  for (const [k, v] of Object.entries(parametri ?? {})) {
    if (!(DOZVOLJENI_PARAMETRI as readonly string[]).includes(k)) continue;
    const oznaka = String(v).toLowerCase();
    if (OZNAKA.test(oznaka)) cisto[k] = oznaka;
  }
  try {
    window.gtag("event", ime, cisto);
  } catch {
    // Merenje nikad ne sme da obori radnju zbog koje je pozvano.
  }
}

/**
 * Briše GA kolačiće (`_ga`, `_ga_<ID>`) pri povlačenju pristanka.
 *
 * GA ih postavlja na najviši domen koji sme (`.ekolo.rs`), a na javnom sufiksu
 * (`*.vercel.app`) bez domena — zato se briše na svakom nivou domena i bez njega.
 */
export function obrisiGaKolacice(): void {
  if (typeof document === "undefined") return;
  const imena = document.cookie
    .split("; ")
    .map((c) => c.split("=")[0])
    .filter((ime) => ime === "_ga" || ime.startsWith("_ga_") || ime === "_gid");
  const delovi = location.hostname.split(".");
  const domeni = [""];
  for (let i = 0; i < delovi.length - 1; i++) domeni.push(`; Domain=.${delovi.slice(i).join(".")}`);
  for (const ime of imena) {
    for (const d of domeni) {
      document.cookie = `${ime}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT${d}`;
    }
  }
}
