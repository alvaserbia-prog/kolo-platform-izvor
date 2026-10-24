import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cron/nadzor-predmeti-cistenje
 *
 * Briše nadzorne predmete zatvorene nalazom da za sumnju NEMA OSNOVA, po isteku
 * 90 dana od zatvaranja (Pravilnik o dokazu stvarnosti 4.2.0, čl. 11a st. 4).
 *
 * Sumnja koja se nije potvrdila ne sme da ostane kao trajna beleška o čoveku.
 * Predmeti sa utvrđenom lažnom verifikacijom se NE brišu ovim putem — oni nestaju
 * zajedno sa poništenom verifikacijom, a trag radnje ostaje u audit logu.
 *
 * Pokreće se dnevno (04:00).
 */
const ROK_DANA = 90;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }

  const granica = new Date();
  granica.setDate(granica.getDate() - ROK_DANA);

  const obrisano = await prisma.nadzorniPredmet.deleteMany({
    where: { status: "NEMA_OSNOVA", resenAt: { lt: granica } },
  });

  console.log(`[Nadzorni predmeti] Obrisano zatvorenih bez osnova: ${obrisano.count}`);

  return NextResponse.json({ ok: true, obrisano: obrisano.count });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
