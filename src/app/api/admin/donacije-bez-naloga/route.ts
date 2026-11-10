import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import {
  DonacijaBezNalogaGreska,
  listaDonacijaBezNaloga,
  unesiDonacijuBezNaloga,
} from "@/lib/protokol/donacija-bez-naloga";

/**
 * GET  /api/admin/donacije-bez-naloga — živi unosi (admin čita).
 * POST /api/admin/donacije-bez-naloga — unos posle utvrđenja prijema (samo superadmin).
 *   body: { naziv: string, iznosRSD: number, datum: ISO }
 *
 * Donacija novca pravnog lica, preduzetnika ili gazdinstva čiji zastupnik nema nalog
 * (donacije čl. 17 st. 4, čl. 25 st. 1; set 5.1.2): bez upisa u evidenciju
 * pokrovitelja i 🔴 bez POEN-a. Naziv i iznos idu na rang-listu uz oznaku „bez POEN-a“.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeAdmin(session.user)) return await greska("Samo admin.", 403);
  return NextResponse.json({ unosi: await listaDonacijaBezNaloga(), smeUnos: jeSuperadmin(session.user) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeSuperadmin(session.user)) return await greska("Samo superadmin.", 403);
  const body = await req.json().catch(() => ({}));
  try {
    const unos = await unesiDonacijuBezNaloga(session.user.id, {
      naziv: body?.naziv,
      iznosRSD: body?.iznosRSD,
      datum: body?.datum,
    });
    return NextResponse.json({ unos });
  } catch (e) {
    if (e instanceof DonacijaBezNalogaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
