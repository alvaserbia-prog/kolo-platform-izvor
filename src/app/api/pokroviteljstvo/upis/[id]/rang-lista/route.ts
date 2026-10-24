import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ukloniUpisSaRangListe, odgovorNaGreskuUpisa } from "@/lib/protokol/upis-pokrovitelja";

/**
 * POST /api/pokroviteljstvo/upis/[id]/rang-lista — na zahtev korisnika koji je vodio
 * OBRISAN upis, pokrovitelj se uklanja i sa rang-liste (donacije čl. 6a st. 6).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await ukloniUpisSaRangListe(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuUpisa(e);
  }
}
