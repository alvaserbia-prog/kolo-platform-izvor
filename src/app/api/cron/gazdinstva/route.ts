import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { obradiUpite } from "@/lib/protokol/gazdinstvo";

/**
 * GET /api/cron/gazdinstva
 *
 * Upiti o preuzimanju izjave o tačnosti podataka (Pravilnik o gazdinstvima čl. 9
 * st. 3, 11 st. 6): upit na koji član nije odgovorio u roku od trideset dana ide
 * sledećem članu po redu pristupanja; kad ga niko ne preuzme, gazdinstvo prestaje
 * (čl. 12a st. 1 t. 1) i doprinos gazdinstva se poništava, odnosno otpisuje.
 *
 * 🔴 Bez ovog posla upit bi čekao zauvek: rok ne pokreće ničiji klik.
 */
async function obradi(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }
  const rezultat = await obradiUpite(new Date());
  return NextResponse.json({ ok: true, ...rezultat });
}

export async function GET(req: NextRequest) {
  return obradi(req);
}

export async function POST(req: NextRequest) {
  return obradi(req);
}
