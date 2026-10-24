import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { listaZabrana } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * GET /api/admin/pokroviteljstvo/zabrane — lista zabrane davalaca posle raskida
 * ugovora o pokroviteljstvu dobrima i uslugama (donacije čl. 13j st. 2).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  return NextResponse.json({ zabrane: await listaZabrana() });
}
