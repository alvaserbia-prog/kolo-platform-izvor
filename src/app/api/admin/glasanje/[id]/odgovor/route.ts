import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { odgovoriNaPreporuku, GlasanjeGreska } from "@/lib/protokol/glasanje";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/glasanje/[id]/odgovor — obrazložen odgovor UO na usvojenu
// dinarsku preporuku (čl. 20). Telo: { odgovor: "PRIHVACENO"|"ODBIJENO", obrazlozenje }.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Samo admin.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odgovoriNaPreporuku(id, body.odgovor, body.obrazlozenje ?? "");
    await logAdminAkcija(session.user.id, "PREPORUKA_ODGOVOR_UO", id,
      `${body.odgovor}${body.obrazlozenje ? ": " + body.obrazlozenje : ""}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GlasanjeGreska) return await greska(e.message, e.status);
    throw e;
  }
}
