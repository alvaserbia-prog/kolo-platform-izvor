import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, odluciOCelinama } from "@/lib/protokol/operativni-postupak";

/**
 * POST — potvrda izvršenja celina (operativni 5.0 čl. 13, 15); stara adresa.
 * Potvrđuju čuvari Kola i lice koje UO ovlasti; superadmin nije izuzet od zabrane
 * za predlagača (#10). POEN se ne emituje sada — ulazi u noćnu raspodelu (čl. 21).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    const r = await odluciOCelinama(session.user.id, id, { odluka: "POTVRDI" });
    return NextResponse.json({ ok: true, predlozeniPoen: r.predlozeniPoen });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
