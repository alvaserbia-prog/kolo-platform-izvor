import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, odluciOCelinama } from "@/lib/protokol/operativni-postupak";

/** POST — odbijanje izvršenja celina uz obrazloženje (operativni 5.0 čl. 15 st. 2 t. 2); stara adresa. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odluciOCelinama(session.user.id, id, { odluka: "ODBIJ", obrazlozenje: body.obrazlozenje ?? body.razlog });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
