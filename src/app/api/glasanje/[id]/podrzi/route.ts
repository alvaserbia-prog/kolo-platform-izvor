import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GlasanjeGreska, podrziPredlog } from "@/lib/protokol/glasanje";
import { dohvatiFazuStatus } from "@/lib/protokol/faza-sistema";

// POST /api/glasanje/[id]/podrzi — podrška čuvara Kola predlogu (Pravilnik o Gornjem
// Kolu čl. 10). Podrška nije glas i ne delegira se.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  // Gornje Kolo postoji tek u Fazi 2 (Pravilnik čl. 41–42; Gornje Kolo čl. 3)
  const faza = await dohvatiFazuStatus();
  if (faza.faza !== "FAZA_2")
    return await greska("Gornje Kolo postoji tek u Fazi 2.", 403);

  const { id } = await params;
  try {
    const r = await podrziPredlog(id, session.user.id);
    return NextResponse.json({ ok: true, brPodrski: r.brPodrski });
  } catch (e) {
    if (e instanceof GlasanjeGreska) return await greska(e.message, e.status);
    throw e;
  }
}
