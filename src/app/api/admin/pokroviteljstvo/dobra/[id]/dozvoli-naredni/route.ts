import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { dozvoliNaredniUgovor, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * POST /api/admin/pokroviteljstvo/dobra/[id]/dozvoli-naredni — odluka Fondacije da
 * davalac sme da zaključi naredni ugovor iako nije iskorišćena polovina vaučera ovog
 * ugovora (donacije čl. 29 st. 4, set 4.8.4; N2-M6). Samo superadmin. Telo: { razlog }.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await dozvoliNaredniUgovor(id, session.user.id, typeof body.razlog === "string" ? body.razlog : "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
