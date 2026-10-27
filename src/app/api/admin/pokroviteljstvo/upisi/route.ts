import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { APR_PRETRAGA_URL } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { listaUpisaZaAdmina } from "@/lib/protokol/upis-pokrovitelja";

/**
 * GET /api/admin/pokroviteljstvo/upisi — upisi pokrovitelja u evidenciju (donacije
 * čl. 16–18) za administratorski tim: podaci za poređenje sa registrom (naziv, MB,
 * zastupnik), kontakt, izmena na proveri i lista zabrane. Samo admin.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  return NextResponse.json({ upisi: await listaUpisaZaAdmina(), aprUrl: APR_PRETRAGA_URL });
}
