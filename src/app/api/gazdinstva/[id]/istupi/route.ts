import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { istupi, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/** POST — istupanje iz gazdinstva (čl. 13 st. 1); POEN ostaje članu. Kad istupa poslednji član, gazdinstvo prestaje (čl. 22 st. 1 t. 1). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    const { prestalo } = await istupi(session.user.id, id);
    return NextResponse.json({ ok: true, prestalo });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
