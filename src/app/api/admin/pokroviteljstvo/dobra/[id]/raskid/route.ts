import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { raskiniUgovorDobra, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

// POST /api/admin/pokroviteljstvo/dobra/[id]/raskid — raskid ugovora po neizvršenju,
// posle prigovora imaoca vaučera tog ugovora (donacije čl. 13j; osmi osnov negativnog
// zapisa, Pravilnik čl. 14 st. 3 t. 8). Telo: { vaucerId, obrazlozenje }.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const r = await raskiniUgovorDobra(
      id,
      typeof body.vaucerId === "string" ? body.vaucerId : "",
      session.user.id,
      typeof body.obrazlozenje === "string" ? body.obrazlozenje : "",
    );
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
