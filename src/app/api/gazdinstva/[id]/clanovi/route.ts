import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pozoviClana, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/** POST — poziv punoletnom korisniku da pristupi gazdinstvu (čl. 7 st. 2). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await pozoviClana(session.user.id, id, body?.pseudonim);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
