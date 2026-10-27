import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, prihvatiDodelu } from "@/lib/protokol/operativni-postupak";

/**
 * POST — zadrugar prihvata celinu zadružnog doprinosa koju mu je zadruga dodelila
 * (operativni 5.0 čl. 23 st. 2), uz izjavu o pravnoj prirodi (čl. 10 st. 1 t. 3,
 * shodno). Preuzimanje je dobrovoljno (čl. 24 st. 2 t. 3).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await prihvatiDodelu(session.user.id, id, { izjavaPotvrdjena: body.izjavaPotvrdjena, planIzvrsenja: body.planIzvrsenja });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
