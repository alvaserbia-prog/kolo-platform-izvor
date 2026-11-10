import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { listaPartnerstavaZaAdmina } from "@/lib/protokol/partnerstvo";

// GET /api/admin/pokroviteljstvo/partnerstvo — prijave partnerstva i partnerstva u izvršenju
// (donacije čl. 41–45), uz upozorenja o istom dobavljaču (čl. 45 st. 1). Odluke donosi samo
// superadmin (direktor), u ruti `[id]`.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  return NextResponse.json({ partnerstva: await listaPartnerstavaZaAdmina() });
}
