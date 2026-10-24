import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { odustani, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/nabavke/[id]/odustani
 *
 * Odustanak (čl. 24 st. 1). Rezervisan POEN se oslobađa, a poziv odmah ide
 * sledećem u redu — isto pravilo koje pokriva i istek roka i nepreuzimanje.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await odustani(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
