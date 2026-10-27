import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { OperativniGreska, povuciZadatak } from "@/lib/protokol/operativni-postupak";

/**
 * POST — povlačenje zadatka (operativni 5.0 čl. 8): `{ obrazlozenje }`, obavezno i
 * javno kad je zadatak u izvršenju. Adresa „zatvori" ostaje radi starih poziva.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await povuciZadatak(session.user.id, id, body.obrazlozenje);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
