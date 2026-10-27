import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { povuciPristanakPrikaza, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * POST /api/vauceri/[id]/povuci-pristanak — imalac povlači pristanak na prikaz
 * zapisa o poništenju uz pseudonim (nabavke čl. 33 st. 2; Politika čl. 29 st. 3).
 *
 * Opis dobra, odnosno usluge i naziv davaoca brišu se iz opisa zapisa; zapis ostaje.
 * Povlači samo imalac, za svoj vaučer (proverava servis).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    const r = await povuciPristanakPrikaza(session.user.id, id);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
