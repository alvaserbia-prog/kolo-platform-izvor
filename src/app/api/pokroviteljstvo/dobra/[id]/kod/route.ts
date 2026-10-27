import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { posaljiKodZaPotpis, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * POST /api/pokroviteljstvo/dobra/[id]/kod — šalje jednokratni šestocifreni kod za
 * potpis ugovora na adresu elektronske pošte podnosioca (donacije čl. 32 st. 1).
 * U bazi ostaje samo heš koda, sa rokom od 15 minuta i najviše 5 pokušaja.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    const r = await posaljiKodZaPotpis(id, session.user.id);
    return NextResponse.json({ ok: true, istice: r.istice });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
