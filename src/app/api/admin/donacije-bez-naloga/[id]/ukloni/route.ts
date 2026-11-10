import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { DonacijaBezNalogaGreska, ukloniDonacijuBezNaloga } from "@/lib/protokol/donacija-bez-naloga";

/**
 * POST /api/admin/donacije-bez-naloga/[id]/ukloni — unos povučen kao greška (samo
 * superadmin). Red ostaje kao istorija, ne prikazuje se na rang-listi i ne ulazi u zbir.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeSuperadmin(session.user)) return await greska("Samo superadmin.", 403);
  const { id } = await params;
  try {
    await ukloniDonacijuBezNaloga(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DonacijaBezNalogaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
