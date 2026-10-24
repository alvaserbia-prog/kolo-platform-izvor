import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { vetoNaIzvrsenje, GlasanjeGreska } from "@/lib/protokol/glasanje";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/glasanje/[id]/veto — Fondacija (UO) obrazloženim vetom
// obustavlja izvršenje usvojene odluke (čl. 18). Telo: { obrazlozenje }.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Samo admin.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await vetoNaIzvrsenje(id, body.obrazlozenje ?? "");
    await logAdminAkcija(session.user.id, "ODLUKA_VETO", id, body.obrazlozenje ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GlasanjeGreska) return await greska(e.message, e.status);
    throw e;
  }
}
