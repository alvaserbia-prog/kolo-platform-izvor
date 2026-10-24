import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska, dohvatiPregledDeteta } from "@/lib/protokol/deca";

/**
 * GET /api/deca/[id]/pregled — „ko i koliko" (Modul Deca, čl. 9 st. 2).
 *
 * 🔴 Ovo je ono što roditelj dobija UMESTO sadržaja razgovora među decom: spisak
 * prijatelja sa datumima i spisak razgovora bez ijedne poruke. Sadržaj se ne vraća
 * i nema rute koja bi ga vratila — razgovor deteta sa drugim detetom dodiruje i
 * tuđe dete, kome njegov roditelj ovaj uvid nije dao.
 *
 * Razgovori sa PUNOLETNIM licima su izuzetak i idu kroz `/api/deca/[id]/razgovori`.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  try {
    return NextResponse.json(await dohvatiPregledDeteta(session.user.id, id));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
