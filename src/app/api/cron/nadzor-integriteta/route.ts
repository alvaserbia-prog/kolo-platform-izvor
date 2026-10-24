import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { pokreniNadzorIntegriteta } from "@/lib/protokol/nadzor-integriteta";

/**
 * POST /api/cron/nadzor-integriteta
 * Noćni nadzor integriteta verifikacija (anti-malverzacija, 1. krug).
 * Računa pravila P1/P2/P5/P9/P11/P12, upisuje obeležene naloge/grupe u
 * `RizikNalaz` i javi superadminima za NOVE HITNO slučajeve. Ne preduzima
 * nikakvu radnju nad nalozima — samo posmatra i obaveštava. Preporučeno: dnevno.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }

  const rez = await pokreniNadzorIntegriteta();
  console.log(
    `[Nadzor integriteta] otvoreno=${rez.ukupno} hitno=${rez.hitno} upozorenje=${rez.upozorenje} noviHitni=${rez.noviHitni}`
  );
  return NextResponse.json({ ok: true, ...rez });
}
