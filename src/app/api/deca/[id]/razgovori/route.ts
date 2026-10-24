import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska, dohvatiRazgovoreDeteta } from "@/lib/protokol/deca";

/**
 * GET /api/deca/[id]/razgovori — razgovori deteta SA PUNOLETNIM LICIMA (čl. 9).
 *
 * 🔴 Razgovore između dece roditelj VIŠE NE ČITA — servis ih ni ne vraća. Umesto
 * sadržaja stoji „ko i koliko" na `/api/deca/[id]/pregled`.
 *
 * Samo čitanje. Rute kojom bi roditelj napisao poruku u detetov razgovor NEMA, i
 * to je namerno: sa druge strane je odrastao čovek, a taj odnos otvara isključivo
 * prekidač iz čl. 10. Punoletnom sagovorniku u razgovoru stoji vidljiv natpis da
 * razgovor čita roditelj — ko piše detetu, treba da zna pred kim piše.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  try {
    return NextResponse.json({ razgovori: await dohvatiRazgovoreDeteta(session.user.id, id) });
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
