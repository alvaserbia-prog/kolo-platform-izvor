import { createHash } from "node:crypto";

/**
 * Čitanje potvrde o uplati NA NAŠEM SERVERU (donacije čl. 6 st. 4, set 5.0.9; odluka
 * vlasnika: „prvi način"). Slika i PDF ne idu nijednom spoljnom servisu — zato nema
 * novog obrađivača (Registar radnji obrade br. 5, Politika čl. 20).
 *
 * - PDF iz aplikacije banke: tekst se čita direktno iz fajla (pdfjs-dist), bez greške.
 * - Snimak ekrana i fotografija naloga: prepoznavanje teksta (tesseract.js, lokalno).
 *   🟡 Jezički podaci za prepoznavanje (`eng`, `srp`) preuzimaju se pri prvom pozivu sa
 *   javnog CDN-a i keširaju u `/tmp`; to je preuzimanje rečnika, slika se nikome ne šalje.
 *
 * Šta je pročitano poredi `uporediPotvrdu()` iz `donacija-unapred-pravila.ts`.
 */

/** Ćirilica → latinica, da se ime sa potvrde na ćirilici poklopi sa imenom u evidenciji. */
const CIR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "đ", е: "e", ж: "ž", з: "z", и: "i", ј: "j", к: "k",
  л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "ć", у: "u",
  ф: "f", х: "h", ц: "c", ч: "č", џ: "dž", ш: "š",
};
export function cir2lat(s: string): string {
  return s.replace(/[Ѐ-ӿ]/g, (ch) => {
    const malo = ch.toLowerCase();
    const l = CIR[malo];
    if (l === undefined) return ch;
    return ch === malo ? l : l.charAt(0).toUpperCase() + l.slice(1);
  });
}

export function hashPotvrde(sadrzaj: Buffer): string {
  return createHash("sha256").update(sadrzaj).digest("hex");
}

async function tekstIzPdf(sadrzaj: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const dok = await pdfjs.getDocument({
    data: new Uint8Array(sadrzaj),
    isEvalSupported: false,
    useSystemFonts: false,
    disableFontFace: true,
  }).promise;
  const delovi: string[] = [];
  const strana = Math.min(dok.numPages, 3);
  for (let i = 1; i <= strana; i++) {
    const p = await dok.getPage(i);
    const c = await p.getTextContent();
    delovi.push(c.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  await dok.destroy();
  return delovi.join("\n");
}

async function tekstIzSlike(sadrzaj: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["eng", "srp"], 1, { cachePath: "/tmp/tessdata" });
  try {
    const { data } = await worker.recognize(sadrzaj);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

/**
 * Tekst sa potvrde, latinicom. Ne baca: nečitljiva potvrda vraća prazan tekst, pa je
 * `uporediPotvrdu` odbija razlogom NECITLJIVO, a donator je šalje ponovo.
 */
export async function procitajPotvrdu(sadrzaj: Buffer, mime: string): Promise<string> {
  try {
    const tekst = mime === "application/pdf" ? await tekstIzPdf(sadrzaj) : await tekstIzSlike(sadrzaj);
    return cir2lat(tekst);
  } catch (e) {
    console.error("[potvrda] čitanje nije uspelo", e);
    return "";
  }
}
