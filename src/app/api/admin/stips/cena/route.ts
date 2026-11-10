import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { cenaStipsZa } from "@/lib/protokol/stips";

/**
 * GET /api/admin/stips/cena?kategorija=… — cena za Republiku Srbiju koja bi se danas primenila
 * (poslednji bilten sa cenom za kategoriju), sa biltenom i cenama pijaca. `null` = nema cene,
 * važi cenovnik davaoca. Set 5.1.3 (donacije čl. 29 st. 1). Samo administratorski tim.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const kategorija = req.nextUrl.searchParams.get("kategorija") ?? "";
  const c = await cenaStipsZa(kategorija, new Date());
  return NextResponse.json({ cena: c ? { ...c, datumObjave: c.datumObjave.toISOString() } : null });
}
