import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { opozoviZaposlenog, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * DELETE /api/vauceri/zaposleni/[id] — podnosilac opoziva ovlašćenje zaposlenog,
 * u svakom trenutku (donacije čl. 13g st. 6). Opozvan red ostaje kao istorija.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await opozoviZaposlenog(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
