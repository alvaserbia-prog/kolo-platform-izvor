import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, odluciOPrijavi } from "@/lib/protokol/operativni-postupak";

/**
 * POST /api/admin/doprinos-oglasi/prijave/[id]/odobri — stara adresa; odluku donosi
 * lice koje potvrđuje (operativni 5.0 čl. 12–13), ne admin nivo kao takav.
 * Jedan ulaz: `odluciOPrijavi` (i `/api/doprinos-oglasi/potvrde/prijava/[id]`).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await odluciOPrijavi(session.user.id, id, { odobri: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
