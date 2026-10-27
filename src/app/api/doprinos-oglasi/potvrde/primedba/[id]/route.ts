import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, odluciOPrimedbi } from "@/lib/protokol/operativni-postupak";

/** POST — izjašnjavanje o primedbi (čl. 18 st. 2): `{ odluka }` (obrazloženo). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odluciOPrimedbi(session.user.id, id, { odluka: body.odluka });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
