import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrijateljGreska, raskiniPrijateljstvo } from "@/lib/protokol/prijateljstva";

/**
 * DELETE /api/deca/prijatelji/[id] — raskid prijateljstva (Modul Deca, čl. 14c).
 *
 * 🔴 Raskinuti može SAMO DETE, bilo koje od dvoje. Rute kojom bi roditelj raskinuo
 * prijateljstvo svog deteta NEMA, i to je namerno: raskid je odnos među decom.
 * Roditelju ostaju brisanje naloga, uklanjanje oglasa i prekidač za odrasle.
 *
 * Otpisuje se 500 POEN obema stranama; zapis sme u minus. Potvrda pre raskida stoji
 * na ekranu, sa jasnim tekstom „izgubićeš 500 POEN".
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  try {
    return NextResponse.json(await raskiniPrijateljstvo(session.user.id, id));
  } catch (e) {
    if (e instanceof PrijateljGreska) return await greska(e.message, e.status);
    throw e;
  }
}
