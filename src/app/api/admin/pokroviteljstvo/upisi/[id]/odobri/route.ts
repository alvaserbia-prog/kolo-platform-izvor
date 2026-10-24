import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { odobriUpis, odgovorNaGreskuUpisa } from "@/lib/protokol/upis-pokrovitelja";

// POST /api/admin/pokroviteljstvo/upisi/[id]/odobri — Fondacija je naziv, MB i
// zastupnika uporedila sa registrom (donacije čl. 6a st. 4). 🔴 Za pravno lice i
// preduzetnika `aprUporedjeno: true` je obavezno; beleži se samo da je poređenje izvršeno.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odobriUpis(id, session.user.id, { aprUporedjeno: body.aprUporedjeno === true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuUpisa(e);
  }
}
