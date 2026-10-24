import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { odbijUpis, odgovorNaGreskuUpisa } from "@/lib/protokol/upis-pokrovitelja";

// POST /api/admin/pokroviteljstvo/upisi/[id]/odbij — odbijanje upisa uz obrazloženje
// (donacije čl. 6a st. 4).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odbijUpis(id, session.user.id, typeof body.razlog === "string" ? body.razlog : "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuUpisa(e);
  }
}
