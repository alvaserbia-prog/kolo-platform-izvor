import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { posaljiKodZaPotpisNovca, PotpisGreska } from "@/lib/protokol/pokroviteljstvo-potpis";

/** POST /api/pokroviteljstvo/prijava/[id]/kod — jednokratni kod za potpis na mejl podnosioca (čl. 13g st. 4). */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    const r = await posaljiKodZaPotpisNovca(id, session.user.id);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof PotpisGreska) return await greska(e.message, e.status);
    throw e;
  }
}
