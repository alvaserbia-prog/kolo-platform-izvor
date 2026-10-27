import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { odgovoriNaPoziv, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/** POST — prihvatanje (uz izjavu o tačnosti i sopstveno ime i prezime) ili odbijanje poziva u gazdinstvo (čl. 9 st. 3). Broj telefona se ne traži — razgovor je samo sa nosiocem (čl. 8). */
export async function POST(req: Request, { params }: { params: Promise<{ clanId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { clanId } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odgovoriNaPoziv(session.user.id, clanId, body?.prihvata === true, body?.uloga, body?.imePrezime);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
