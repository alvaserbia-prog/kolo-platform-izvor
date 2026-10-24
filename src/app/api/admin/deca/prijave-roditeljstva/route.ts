import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { prijaveRoditeljstva } from "@/lib/protokol/deca";

/**
 * GET /api/admin/deca/prijave-roditeljstva[?sve=1] — prijave lažnog roditeljstva
 * (Pravilnik o učešću dece čl. 4e). Podrazumevano samo otvorene.
 *
 * Podnosilac se vidi SAMO ovde, ovlašćenom licu Fondacije; licu na koje se prijava
 * odnosi se ne otkriva (st. 3).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const sve = req.nextUrl.searchParams.get("sve") === "1";
  return NextResponse.json({ prijave: await prijaveRoditeljstva(sve ? "SVE" : "OTVORENA") });
}
