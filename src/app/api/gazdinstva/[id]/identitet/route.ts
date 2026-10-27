import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upisiImeClana, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST — član gazdinstva upisuje sopstveno ime i prezime u evidenciju identiteta
 * (Pravilnik o gazdinstvima čl. 9 st. 3, set 4.7.3). Za članove koji su pristupili
 * pre nego što je ime postalo deo prijave.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await upisiImeClana(session.user.id, id, body?.imePrezime);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
