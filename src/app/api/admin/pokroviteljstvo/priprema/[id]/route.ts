import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { povuciPripremu, odgovorNaGreskuPripreme } from "@/lib/protokol/priprema-pokroviteljstva";

// DELETE /api/admin/pokroviteljstvo/priprema/[id] — povlačenje pripremljenog upisa koji lice
// još nije prihvatilo (donacije čl. 16 st. 6). Samo superadmin.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  try {
    await povuciPripremu(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuPripreme(e);
  }
}
