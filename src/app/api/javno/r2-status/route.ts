import { NextResponse } from "next/server";
import { r2Konfigurisan } from "@/lib/skladiste";

/**
 * GET /api/javno/r2-status
 * PRIVREMENA javna dijagnostika (BEZ prijave): da li je Cloudflare R2 povezan
 * u trenutnom okruženju. Vraća SAMO imena R2_* varijabli i status — nikad
 * vrednosti/tajne. Ukloniti posle provere.
 */
export async function GET() {
  const svaImena = Object.keys(process.env);
  const r2Imena = svaImena.filter((k) => /^R2_/i.test(k));
  const obavezne = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"];

  return NextResponse.json({
    r2Konfigurisan: r2Konfigurisan(),
    vercelEnv: process.env.VERCEL_ENV ?? null, // production | preview | development
    imenaR2Env: r2Imena, // samo imena, bez vrednosti
    nedostaje: obavezne.filter((k) => !process.env[k]),
  });
}
