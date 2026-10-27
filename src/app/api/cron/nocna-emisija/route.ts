import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { izvrsiNocnuEmisiju } from "@/lib/protokol/programi";
import { izvrsiZrnoOperacije } from "@/lib/protokol/zrno";
import { proveriIAktivirajFazu2 } from "@/lib/protokol/faza-sistema";
import { azurirajStalnuPonudu, zapisiDnevniSnimak } from "@/lib/protokol/pokazatelji";
import { proveriIEvidentirajKorak } from "@/lib/protokol/osnivacki";
import { jePonocUSrbiji } from "@/lib/protokol/obracunski-dan";

// GET /api/cron/nocna-emisija — Vercel Cron (Authorization: Bearer), zakazan u
// 22:00 i 23:00 UTC (drugi termin kroz /api/cron/nocna-emisija/zima). Radi samo
// termin koji pada u ponoć po srpskom vremenu (Pravilnik čl. 26), drugi preskače.
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
  return await nocniObracun(datum, { osnivacki: true });
}

// POST /api/cron/nocna-emisija — manuelni poziv (x-cron-secret), bez provere sata.
// Dvostruki prolaz istog dana sprečava brava dana u `izvrsiNocnuEmisiju`.
// 🔴 Osnivački korak se ovde PRESKAČE: proverava se samo na kraju obračunskog perioda
// (Pravilnik o osnivačkom doprinosu čl. 6 st. 2–3), a ručni poziv može pasti usred
// perioda. Preskočeni prag uhvatiće naredni noćni obračun (GET), koji pali sve
// dostignute korake.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }
  return await nocniObracun(new Date(), { osnivacki: false });
}

async function nocniObracun(datum: Date, opcije: { osnivacki: boolean }) {
  try {
    // 1. Emisije programa i ZRNO operacije (paralelno — nezavisne)
    const [programi, zrno] = await Promise.all([
      izvrsiNocnuEmisiju(datum),
      izvrsiZrnoOperacije(datum),
    ]);

    // 2. Osnivački doprinos (čl. 6 st. 3 Pravilnika o osnivačkom doprinosu). Sekvencijalno,
    // nakon emisija, pre Faze 2 — POEN osnivačkog doprinosa ulazi u kumulativni rast
    // (čl. 6 st. 4). Izolovano: greška ovde ne sme da blokira proveru Faze 2.
    //
    // Evidentira sam, bez ljudske potvrde. Ako je opticaj preskočio više pragova
    // odjednom (velika bulk emisija), `proveriIEvidentirajKorak` pali korake
    // uzastopno dok ne nadoknadi sve preskočene.
    let osnivacki: unknown = null;
    if (!opcije.osnivacki) {
      osnivacki = { preskoceno: "ručni poziv — osnivački korak samo na kraju obračunskog perioda" };
    } else {
      try {
        osnivacki = await proveriIEvidentirajKorak();
      } catch (e) {
        console.error("[CRON] Greška pri osnivačkom doprinosu:", e);
        osnivacki = { error: String(e) };
      }
    }

    // 3. Provera praga Faze 2 (Pravilnik čl. 41) — sekvencijalno, nakon emisija
    // jer obračun zavisi od konačnog stanja Protokola za obračunski period.
    const faza = await proveriIAktivirajFazu2();

    // 4. Pokazatelji zdravlja i koncentracije (`/sistem/zdravlje`): stanje stalne
    // ponude gazdinstava i dnevni snimak. Posle svega, jer mere konačno stanje
    // perioda; izolovano — pokazatelj nema dejstvo i ne sme da obori obračun.
    let pokazatelji: unknown = null;
    try {
      const ponuda = await azurirajStalnuPonudu();
      const snimljeno = await zapisiDnevniSnimak(datum);
      pokazatelji = { ponuda, snimljeno };
    } catch (e) {
      console.error("[CRON] Greška pri pokazateljima:", e);
      pokazatelji = { error: String(e) };
    }

    return NextResponse.json({ ok: true, programi, zrno, osnivacki, faza, pokazatelji });
  } catch (err) {
    console.error("[CRON] Greška pri nocnoj emisiji:", err);
    return await greska("Greška pri izvršavanju emisije.", 500);
  }
}
