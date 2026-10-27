import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { jeCronPoziv } from "@/lib/cron-auth";
import { ocistiNalaze, pokreniNadzorIntegriteta } from "@/lib/protokol/nadzor-integriteta";

/**
 * POST /api/cron/nadzor-integriteta
 * Noćni nadzor integriteta verifikacija (anti-malverzacija, 1. krug).
 * Računa pravila P1/P2/P5/P9/P11/P12, upisuje obeležene naloge/grupe u
 * `RizikNalaz` i javi superadminima za NOVE HITNO slučajeve. Ne preduzima
 * nikakvu radnju nad nalozima — samo posmatra i obaveštava. Preporučeno: dnevno.
 *
 * Posle prolaza sprovodi rok čuvanja nalaza (Politika čl. 19 st. 7): pregledan
 * najduže 12 meseci, a nalazi vezani za nalog kome je status prestao se brišu.
 */
export async function POST(req: NextRequest) {
  if (!jeCronPoziv(req)) {
    return await greska("Neautorizovano.", 401);
  }

  const rez = await pokreniNadzorIntegriteta();
  const ciscenje = await ocistiNalaze();
  console.log(
    `[Nadzor integriteta] otvoreno=${rez.ukupno} hitno=${rez.hitno} upozorenje=${rez.upozorenje} noviHitni=${rez.noviHitni} ` +
      `obrisano pregledanih=${ciscenje.pregledani} prestalih=${ciscenje.prestali}`
  );
  return NextResponse.json({ ok: true, ...rez, ciscenje });
}

// GET — Vercel Cron (Authorization: Bearer).
export async function GET(req: NextRequest) {
  return POST(req);
}
