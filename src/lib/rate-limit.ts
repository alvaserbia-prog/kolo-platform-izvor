/**
 * Jednostavan in-memory rate-limiter (fiksni prozor) — bez eksternih zavisnosti.
 *
 * OGRANIČENJE (serverless/Vercel): stanje živi u memoriji jedne instance (lambda).
 * Topli kontejneri se ponovo koriste, pa ovo zaustavlja nalete na istu instancu, ali
 * NIJE globalno deljeno. Za jaču zaštitu (više instanci) preporučen je deljeni store
 * (npr. Upstash Redis) — tada zameniti samo telo `rateLimit`. Za sada značajno podiže
 * cenu brute-force-a / spama na ključnim tačkama (login, registracija, reset, verifikacija).
 */

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

function sweep(now: number) {
  if (store.size < 5000) return;
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}

export interface RateRezultat {
  ok: boolean;
  retryAfterSec: number;
}

/**
 * Dozvoli najviše `limit` zahteva po `key` u prozoru `windowMs`.
 * Vraća `{ ok: false, retryAfterSec }` kad je kvota probijena.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateRezultat {
  const now = Date.now();
  sweep(now);
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, retryAfterSec: 0 };
}

/** Najbolja procena IP-a klijenta iza Vercel/Cloudflare proxy-ja. */
export function klijentIP(req: { headers: { get(name: string): string | null } }): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "nepoznat";
}
