import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeSuperadmin } from "@/lib/dozvole";
import {
  moguciVisestrukiNalozi,
  predmetiVisestrukihNaloga,
  utvrdiVisestrukiNalog,
  VisestrukiGreska,
} from "@/lib/protokol/visestruki-nalog";

/**
 * Višestruki nalog istog lica (dokaz stvarnosti čl. 13 i 14; set 4.8.4; N4-M2/M3).
 * Samo superadmin.
 *
 * GET  — mogući višestruki nalozi (grupe po istom broju, odnosno istom imenu, samo
 *        pseudonimi i mesta — bez imena i broja) i utvrđenja sa nadzornim predmetom.
 * POST — utvrđenje. Telo: { zadrzaniId, ugaseniId, obrazlozenje, iskljuci }.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const [grupe, predmeti] = await Promise.all([moguciVisestrukiNalozi(), predmetiVisestrukihNaloga()]);
  return NextResponse.json({ grupe, predmeti });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const body = await req.json().catch(() => ({}));
  try {
    const r = await utvrdiVisestrukiNalog(session.user.id, {
      zadrzaniId: typeof body.zadrzaniId === "string" ? body.zadrzaniId : "",
      ugaseniId: typeof body.ugaseniId === "string" ? body.ugaseniId : "",
      obrazlozenje: typeof body.obrazlozenje === "string" ? body.obrazlozenje : "",
      iskljuci: body.iskljuci === true,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof VisestrukiGreska) return await greska(e.message, e.status);
    console.error("[POST /api/admin/visestruki-nalozi]", e);
    return await greska("Greška.", 500);
  }
}
