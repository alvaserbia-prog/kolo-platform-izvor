import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OperativniGreska, podnesiPrimedbu } from "@/lib/protokol/operativni-postupak";

/**
 * POST — primedba učesnika na prijavu, plan, potvrdu celina ili završnu potvrdu
 * (operativni 5.0 čl. 18). Dostupna je svim učesnicima, bez pseudonima podnosioca.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await podnesiPrimedbu(session.user.id, id, {
      predmet: body.predmet,
      tekst: body.tekst,
      prijavaId: body.prijavaId,
      evidencijaId: body.evidencijaId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
