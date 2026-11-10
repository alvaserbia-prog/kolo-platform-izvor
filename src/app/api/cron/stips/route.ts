import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { pronadjiNoveBiltene } from "@/lib/protokol/stips";

/**
 * GET /api/cron/stips
 *
 * Pronalazi nove STIPS biltene (set 5.1.3; donacije čl. 29 st. 1): čita spisak biltena na
 * STIPS-u, za nov bilten stranicu i vezu na PDF, i upisuje `StipsBilten`. Dominantne cene po
 * pijaci unosi administratorski tim (Admin → STIPS). Greška mreže se beleži i ne obara posao.
 */
async function obradi(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }
  const rezultat = await pronadjiNoveBiltene(new Date());
  return NextResponse.json({ ok: true, ...rezultat });
}

export async function GET(req: NextRequest) {
  return obradi(req);
}

export async function POST(req: NextRequest) {
  return obradi(req);
}
