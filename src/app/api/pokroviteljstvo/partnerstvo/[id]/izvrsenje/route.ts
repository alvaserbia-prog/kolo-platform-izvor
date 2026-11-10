import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { procitajIzvrsenje, prijaviIzvrsenje, odgovorNaGreskuPartnerstva } from "@/lib/protokol/partnerstvo";

// POST /api/pokroviteljstvo/partnerstvo/[id]/izvrsenje — lice koje vodi upis prijavljuje
// izvršen deo partnerstva (donacije čl. 43): obim u jedinicama iz ugovora i opis.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const provera = procitajIzvrsenje(body);
  if (!provera.ok) return await greska(provera.razlog, 400);
  try {
    const r = await prijaviIzvrsenje(session.user.id, id, provera.podaci);
    return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
  } catch (e) {
    return await odgovorNaGreskuPartnerstva(e);
  }
}
