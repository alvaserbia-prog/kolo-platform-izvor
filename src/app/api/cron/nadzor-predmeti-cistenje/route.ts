import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { jeCronPoziv } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { obrisiIstekleNegativneZapise } from "@/lib/protokol/negativan-zapis-prestanak";

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
 * Briše i sačuvane negativne zapise prestalih naloga kojima je istekao rok od pet
 * godina od prestanka statusa (Pravilnik čl. 33 st. 7, Registar br. 29; set 5.1.2) —
 * ovde, a ne u mesečnom `gdpr-cistenje`, da rok ne bude prekoračen ni za dan.
 *
 * Pokreće se dnevno (04:00).
 */
const ROK_DANA = 90;

export async function POST(req: NextRequest) {
  if (!jeCronPoziv(req)) {
    return await greska("Neautorizovano.", 401);
  }

  const granica = new Date();
  granica.setDate(granica.getDate() - ROK_DANA);

  const obrisano = await prisma.nadzorniPredmet.deleteMany({
    where: { status: "NEMA_OSNOVA", resenAt: { lt: granica } },
  });

  const negativniZapisi = await obrisiIstekleNegativneZapise();

  console.log(
    `[Nadzorni predmeti] Obrisano zatvorenih bez osnova: ${obrisano.count}, isteklih negativnih zapisa: ${negativniZapisi}`,
  );

  return NextResponse.json({ ok: true, obrisano: obrisano.count, negativniZapisi });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
