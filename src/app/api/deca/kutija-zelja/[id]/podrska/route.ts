import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { KutijaGreska, podrziZelju } from "@/lib/protokol/kutija-zelja";

/**
 * POST   /api/deca/kutija-zelja/[id]/podrska — dete podržava prikazan predlog.
 * DELETE /api/deca/kutija-zelja/[id]/podrska — povlači podršku.
 *
 * Jedan glas po detetu po predlogu; svoj predlog dete ne podržava. Podrška ne
 * donosi ništa ni detetu ni autoru.
 */
async function obradi(dajem: boolean, params: Promise<{ id: string }>) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    return NextResponse.json(await podrziZelju(session.user.id, id, dajem));
  } catch (e) {
    if (e instanceof KutijaGreska) return await greska(e.message, e.status);
    throw e;
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return obradi(true, params);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return obradi(false, params);
}
