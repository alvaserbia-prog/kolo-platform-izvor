import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { OperativniGreska, obustaviZadatak } from "@/lib/protokol/operativni-postupak";

/**
 * POST — upis odluke UO o privremenoj obustavi potvrde i raspodele dok se ne odluči
 * o primedbi (čl. 18 st. 2): `{ obrazlozenje }`, ili `{ ukini: true }`.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await obustaviZadatak(session.user.id, id, body.obrazlozenje, body.ukini === true);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
