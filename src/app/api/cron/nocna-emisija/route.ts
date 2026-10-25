import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { izvrsiNocnuEmisiju } from "@/lib/protokol/programi";
import { izvrsiZrnoOperacije } from "@/lib/protokol/zrno";
import { proveriIAktivirajFazu2 } from "@/lib/protokol/faza-sistema";
import { proveriIEvidentirajKorak } from "@/lib/protokol/osnivacki";
import { jePonocUSrbiji } from "@/lib/protokol/obracunski-dan";

// GET /api/cron/nocna-emisija — Vercel Cron (Authorization: Bearer), zakazan u
// 22:00 i 23:00 UTC (drugi termin kroz /api/cron/nocna-emisija/zima). Radi samo
// termin koji pada u ponoć po srpskom vremenu (Pravilnik čl. 24), drugi preskače.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }
  const datum = new Date();
  if (!jePonocUSrbiji(datum)) {
    return NextResponse.json({ ok: true, preskoceno: "nije ponoć po srpskom vremenu" });
  }
  return await nocniObracun(datum);
}

// POST /api/cron/nocna-emisija — manuelni poziv (x-cron-secret), bez provere sata.
// Dvostruki prolaz istog dana sprečava brava dana u `izvrsiNocnuEmisiju`.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }
  return await nocniObracun(new Date());
}

async function nocniObracun(datum: Date) {
  try {
    // 1. Emisije programa i ZRNO operacije (paralelno — nezavisne)
    const [programi, zrno] = await Promise.all([
      izvrsiNocnuEmisiju(datum),
      izvrsiZrnoOperacije(datum),
    ]);

    // 2. Osnivački doprinos (čl. 9 Pravilnika o osnivačkom doprinosu). Sekvencijalno,
    // nakon emisija, pre Faze 2 — POEN osnivačkog doprinosa ulazi u kumulativni rast
    // (čl. 7). Izolovano: greška ovde ne sme da blokira proveru Faze 2.
    //
    // Evidentira sam, bez ljudske potvrde. Ako je opticaj preskočio više pragova
    // odjednom (velika bulk emisija), `proveriIEvidentirajKorak` pali korake
    // uzastopno dok ne nadoknadi sve preskočene.
    let osnivacki: unknown = null;
    try {
      osnivacki = await proveriIEvidentirajKorak();
    } catch (e) {
      console.error("[CRON] Greška pri osnivačkom doprinosu:", e);
      osnivacki = { error: String(e) };
    }

    // 3. Provera praga Faze 2 (čl. 42, 44) — sekvencijalno, nakon emisija
    // jer obračun zavisi od konačnog stanja Protokola za obračunski period.
    const faza = await proveriIAktivirajFazu2();

    return NextResponse.json({ ok: true, programi, zrno, osnivacki, faza });
  } catch (err) {
    console.error("[CRON] Greška pri nocnoj emisiji:", err);
    return await greska("Greška pri izvršavanju emisije.", 500);
  }
}
