import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pretraziSkole } from "@/lib/skola";

/**
 * Pretraga škola za padajuću listu u obrascu.
 *
 * 🔴 Zašto ruta, a ne šifarnik u pretraživaču: spisak nosi oko 1.600 škola, što je
 * preko sto kilobajta u paketu koji bi se učitavao svakome — a treba samo detetu
 * koje bira školu, jednom. Isto rešenje kao kod naselja ne bi prošlo, jer je taj
 * spisak petostruko manji.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const q = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({ skole: pretraziSkole(q, { limit: 20 }) });
}
