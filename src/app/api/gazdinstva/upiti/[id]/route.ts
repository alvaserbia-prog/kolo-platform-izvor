import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { odgovoriNaUpit, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST — odgovor člana gazdinstva na upit da preuzme izjavu o tačnosti podataka
 * (Pravilnik o gazdinstvima čl. 13 st. 2–3, 21 st. 3): `{ preuzima: boolean }`.
 * Odbijanje šalje upit sledećem članu po redu; kad ga niko ne preuzme, gazdinstvo
 * prestaje (čl. 22 st. 1 t. 1).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const rezultat = await odgovoriNaUpit(session.user.id, id, body?.preuzima === true);
    return NextResponse.json({ ok: true, ...rezultat });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
