import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, odluciOCelinama } from "@/lib/protokol/operativni-postupak";

/**
 * POST — izjašnjavanje o izvršenju celina (čl. 15 st. 2):
 * `{ odluka: POTVRDI | ODBIJ | DOPUNA, obrazlozenje }`.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const r = await odluciOCelinama(session.user.id, id, { odluka: body.odluka, obrazlozenje: body.obrazlozenje });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
