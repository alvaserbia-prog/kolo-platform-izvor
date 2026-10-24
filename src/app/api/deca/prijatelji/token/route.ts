import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrijateljGreska, generisiToken } from "@/lib/protokol/prijateljstva";

/**
 * POST /api/deca/prijatelji/token — jednokratni kod za povezivanje.
 *
 * Vraća SAMO token (sadržaj QR-a) i trenutak isteka. Šestocifrenog broja nema
 * namerno: broj se izdiktira telefonom, a QR se mora pokazati — to je jedino što
 * traži da dvoje stvarno budu jedno pored drugog.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  try {
    return NextResponse.json(await generisiToken(session.user.id));
  } catch (e) {
    if (e instanceof PrijateljGreska) return await greska(e.message, e.status);
    throw e;
  }
}
