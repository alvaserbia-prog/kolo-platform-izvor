import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { imaUlazZaPotvrde, pregledZaPotvrdu } from "@/lib/protokol/operativni-postupak";

/**
 * GET — prijave koje čekaju odobrenje plana. Ulaz imaju lica koja potvrđuju
 * (čuvari Kola i lice koje UO ovlasti; operativni 5.0 čl. 13 st. 1), ne admin nivo.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(await imaUlazZaPotvrde(session.user.id))) return await greska("Pristup odbijen.", 403);
  const { prijave } = await pregledZaPotvrdu();
  return NextResponse.json({
    prijave: prijave.map((p) => ({
      id: p.id,
      pseudonim: p.user.pseudonim,
      oglasTitle: p.oglas.title,
      predlozeniPoen: p.oglas.predlozeniPoen,
      positions: p.oglas.positions,
      planIzvrsenja: p.planIzvrsenja,
      izjavaTekst: p.izjavaTekst,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
