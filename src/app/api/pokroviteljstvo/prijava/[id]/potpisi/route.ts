import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { potpisiPrijavuNovca, PotpisGreska } from "@/lib/protokol/pokroviteljstvo-potpis";

/**
 * POST /api/pokroviteljstvo/prijava/[id]/potpisi — podnosilac potpisuje ugovor o
 * novčanom pokroviteljstvu (čl. 8 st. 1 → postupak iz čl. 13g st. 4; F5-M1).
 * Telo: { kod, procitao, ovlascen, saglasan }. Jedan klik više nije potpis.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const r = await potpisiPrijavuNovca(id, session.user.id, {
      kod: body?.kod, procitao: body?.procitao, ovlascen: body?.ovlascen, saglasan: body?.saglasan,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof PotpisGreska) return await greska(e.message, e.status);
    throw e;
  }
}
