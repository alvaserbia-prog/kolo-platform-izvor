import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeSuperadmin } from "@/lib/dozvole";
import { zatvoriPredmetVisestrukog, VisestrukiGreska } from "@/lib/protokol/visestruki-nalog";

/**
 * POST — zatvaranje nadzornog predmeta nad primaocima prepisa sa ugašenog naloga
 * (dokaz stvarnosti čl. 4b). Samo superadmin; beleška obavezna. Bez dejstva na
 * naloge primalaca. Telo: { beleska }.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await zatvoriPredmetVisestrukog(session.user.id, id, typeof body.beleska === "string" ? body.beleska : "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof VisestrukiGreska) return await greska(e.message, e.status);
    console.error("[POST /api/admin/visestruki-nalozi/zatvori]", e);
    return await greska("Greška.", 500);
  }
}
