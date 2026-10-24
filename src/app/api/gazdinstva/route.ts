import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gazdinstvaZaMapu, prijaviGazdinstvo, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * GET  /api/gazdinstva — tačke javne mape (Pravilnik o gazdinstvima čl. 11).
 *      Javno: bez adrese i bez BPG-a.
 * POST /api/gazdinstva — prijava gazdinstva (čl. 4); otvara se kao nacrt.
 */
export async function GET() {
  return NextResponse.json({ gazdinstva: await gazdinstvaZaMapu() });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return await greska("Neispravan zahtev.", 400);
  try {
    const g = await prijaviGazdinstvo(session.user.id, body);
    return NextResponse.json({ ok: true, id: g.id });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
