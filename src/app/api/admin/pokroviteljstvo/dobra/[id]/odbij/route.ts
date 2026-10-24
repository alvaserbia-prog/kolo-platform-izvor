import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { odbijPrijavuDobra, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

// POST /api/admin/pokroviteljstvo/dobra/[id]/odbij — odbijanje uz obrazloženje
// (donacije čl. 13f st. 2: nema fotografije cenovnika, ili podaci ne odgovaraju APR-u).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odbijPrijavuDobra(id, session.user.id, typeof body.razlog === "string" ? body.razlog : "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
