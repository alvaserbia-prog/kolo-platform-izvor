import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, odustani } from "@/lib/protokol/operativni-postupak";

/**
 * POST — odustanak izvršioca (operativni 5.0 čl. 17): elektronska izjava, bez
 * obrazloženja i bez posledica osim izostanka evidencije za neizvršeni deo.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  const { id } = await params;
  try {
    await odustani(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
