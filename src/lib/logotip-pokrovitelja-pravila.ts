/**
 * Logotip pokrovitelja — čista pravila (bez Prisme; uvozi ih i pretraživač).
 *
 * Pravilnik o pokroviteljstvu i donacijama čl. 13 st. 4 (set 4.7.8): pokrovitelj
 * može priložiti logotip, koji Fondacija objavljuje uz naziv na rang-listi, a kod
 * pokroviteljstva dobrima i uslugama i na vaučerima i uz ponudu vaučera. Logotip
 * je deo evidencije pokrovitelja (naziv i logotip, ništa drugo) i prilaže se u
 * prijavi, kad saradnja počinje. Nije obavezan.
 *
 * 🔴 Uz logotip se ne objavljuje ništa drugo: ni veza ka internet stranici, ni
 * slogan, ni opis (čl. 13 st. 5 — pokrovitelj ne stiče pravo na upućivanje na svoju
 * internet stranicu ni na bilo koju promotivnu činidbu). Zato logotip nikad nije
 * link. Brana: `__tests__/logotip-pokrovitelja-izvor.test.ts`.
 *
 * 🔴 Samo rasterski formati: SVG može da nosi `<script>` i postaje stored-XSS kad
 * se servira sa javnog skladišta (isto kao avatar i slike Pijace).
 */

/** Najveća veličina logotipa: 1 MB. */
export const LOGOTIP_MAX_BAJTOVA = 1024 * 1024;

export const LOGOTIP_DOZVOLJENI_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type LogotipMime = (typeof LOGOTIP_DOZVOLJENI_MIME)[number];

/** `accept` za polje za izbor fajla. */
export const LOGOTIP_PRIHVATA = LOGOTIP_DOZVOLJENI_MIME.join(",");

/** Prefiks ključa na skladištu — po njemu server prepoznaje svoj logotip. */
export const LOGOTIP_PREFIKS = "pokrovitelji-logo/";

/** Najduži razlog uklanjanja (moderacija). */
export const MAX_RAZLOG_UKLANJANJA = 500;

/** Provera onoga što pretraživač prijavi o fajlu, pre slanja i na serveru. */
export function proveriLogotip(f: { tip: string; velicina: number }): { ok: true } | { ok: false; razlog: string } {
  if (!(LOGOTIP_DOZVOLJENI_MIME as readonly string[]).includes(f.tip))
    return { ok: false, razlog: "Logotip može biti JPG, PNG ili WebP." };
  if (f.velicina <= 0) return { ok: false, razlog: "Fajl je prazan." };
  if (f.velicina > LOGOTIP_MAX_BAJTOVA) return { ok: false, razlog: "Logotip može imati najviše 1 MB." };
  return { ok: true };
}

/**
 * Stvarni format slike po prvim bajtovima. Pretraživač šalje tip koji je sam
 * pretpostavio po nastavku imena, pa se server na njega ne oslanja.
 */
export function prepoznajFormat(b: Uint8Array): LogotipMime | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  )
    return "image/png";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";
  return null;
}

/** Nastavak imena fajla za dati format. */
export function nastavakZa(mime: LogotipMime): string {
  return mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
}

/**
 * Da li je URL logotip sa NAŠEG skladišta. Prijava prima samo URL koji je vratio
 * naš upload — inače bi se kroz polje mogla upisati bilo koja adresa (i ona koja
 * prati ko gleda rang-listu).
 */
export function jeNasLogotip(url: unknown, javnaBaza: string): url is string {
  if (typeof url !== "string" || !javnaBaza) return false;
  const baza = javnaBaza.replace(/\/$/, "");
  if (!url.startsWith(`${baza}/${LOGOTIP_PREFIKS}`)) return false;
  const ostatak = url.slice(baza.length + 1 + LOGOTIP_PREFIKS.length);
  return /^[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(ostatak);
}

/** Razlog uklanjanja je obavezan (moderacija: uklanjanje uz razlog, nikad prepravka). */
export function procitajRazlogUklanjanja(v: unknown): { ok: true; razlog: string } | { ok: false; razlog: string } {
  const r = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  if (r.length < 3) return { ok: false, razlog: "Upiši razlog uklanjanja logotipa." };
  if (r.length > MAX_RAZLOG_UKLANJANJA) return { ok: false, razlog: "Razlog je predugačak." };
  return { ok: true, razlog: r };
}
