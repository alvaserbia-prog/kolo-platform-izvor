import { AwsClient } from "aws4fetch";

/**
 * Skladište slika na Cloudflare R2 (S3-kompatibilan API).
 *
 * Potrebne env varijable (Vercel → projekat `kolo`, sva okruženja):
 *   R2_ACCOUNT_ID         — Cloudflare account ID (deo endpoint hosta)
 *   R2_ACCESS_KEY_ID      — R2 API token: Access Key ID
 *   R2_SECRET_ACCESS_KEY  — R2 API token: Secret Access Key
 *   R2_BUCKET             — naziv bucket-a
 *   R2_PUBLIC_URL         — javni bazni URL bucket-a (r2.dev ili custom domen),
 *                           npr. https://pub-xxxx.r2.dev  ili  https://slike.ekolo.rs
 *
 * U bazu se upisuje JAVNI URL (https://.../<kljuc>), pa ga browser/CDN keširaju.
 */

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.R2_BUCKET;
const PUBLIC = process.env.R2_PUBLIC_URL;
const KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET = process.env.R2_SECRET_ACCESS_KEY;

export function r2Konfigurisan(): boolean {
  return !!(ACCOUNT && BUCKET && PUBLIC && KEY && SECRET);
}

/** Javni bazni URL skladišta (bez završne kose crte); prazan kad nije podešen. */
export function javnaBazaSkladista(): string {
  return javniBaza();
}

function javniBaza(): string {
  return (PUBLIC ?? "").replace(/\/$/, "");
}

let _client: AwsClient | null = null;
function client(): AwsClient {
  if (!_client) {
    _client = new AwsClient({
      accessKeyId: KEY!,
      secretAccessKey: SECRET!,
      region: "auto",
      service: "s3",
    });
  }
  return _client;
}

/** Path-style S3 endpoint za R2 (privatni — koristi se samo za upload/brisanje). */
function endpoint(kljuc: string): string {
  // Svaki segment kodiramo, ali zadržavamo "/" kao razdelnik putanje.
  const safe = kljuc.split("/").map(encodeURIComponent).join("/");
  return `https://${ACCOUNT}.r2.cloudflarestorage.com/${BUCKET}/${safe}`;
}

/** Sačuvaj objekat na R2 i vrati JAVNI URL. */
export async function sacuvajNaR2(
  kljuc: string,
  telo: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  // Buffer/Uint8Array → svež ArrayBuffer. ArrayBuffer je deo `BodyInit`, pa
  // izbegavamo TS 5.7+ neslaganje (Uint8Array<ArrayBufferLike> nije BodyInit).
  // aws4fetch hešira telo i šalje ga isto kao i typed array.
  const ab = telo.buffer.slice(
    telo.byteOffset,
    telo.byteOffset + telo.byteLength
  ) as ArrayBuffer;
  // R2 zahteva Content-Length na PUT-u. Za veće telo undici (Node) inače
  // bira Transfer-Encoding: chunked → R2 vraća 411 MissingContentLength.
  // Eksplicitno postavljamo dužinu da se to izbegne.
  const res = await client().fetch(endpoint(kljuc), {
    method: "PUT",
    body: ab,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(ab.byteLength),
      // Ključ objekta je UUID (sadržaj se nikad ne menja na istom ključu) → smemo
      // dugi immutable keš. R2 čuva ovaj header i vraća ga na javnom (r2.dev/CDN)
      // URL-u, pa browser ne preuzima istu sliku iznova (Lighthouse „efficient
      // cache lifetimes"). Važi za nove uploade; postojeće slike dobiju keš tek
      // pri sledećem upisu ili kroz Next image optimizaciju (/_next/image).
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  if (!res.ok) {
    const detalj = await res.text().catch(() => "");
    throw new Error(`R2 upload nije uspeo (${res.status}): ${detalj}`);
  }
  return `${javniBaza()}/${kljuc.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Best-effort brisanje objekta sa R2 na osnovu javnog URL-a.
 * Preskače URL-ove koji nisu sa našeg R2 javnog bazena (legacy Blob/base64/lokalni).
 */
export async function obrisiSaR2(url: string | null | undefined): Promise<void> {
  if (!url || !r2Konfigurisan()) return;
  const baza = javniBaza();
  if (!baza || !url.startsWith(baza + "/")) return;
  const kodiraniKljuc = url.slice(baza.length + 1);
  const kljuc = kodiraniKljuc.split("/").map(decodeURIComponent).join("/");
  try {
    await client().fetch(endpoint(kljuc), { method: "DELETE" });
  } catch {
    /* best-effort */
  }
}
