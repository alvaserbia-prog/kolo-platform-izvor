import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { smeRaditiZaZadrugu } from "@/lib/dozvole";
import { OperativniGreska, objaviZadruzniZadatak } from "@/lib/protokol/operativni-postupak";

/**
 * POST — objava organizacione celine zadruge (operativni čl. 4 st. 4, 23 st. 2;
 * zadruge čl. 17 st. 2): celinu objavljuje zadruga — zadružni admin svoje zadruge ili
 * administratorski tim u ime zadruge. Učesnici se na celinu sami prijavljuju (čl. 9,
 * 11, 12); izvršioca niko ne dodeljuje. 🔴 Dok UO ne utvrdi iznos jedinice, objava se
 * odbija.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true, adminZadrugaId: true } });
  const { id } = await params;
  if (!smeRaditiZaZadrugu(me, id)) return await greska("Nemate ovlašćenje.", 403);
  const body = await req.json().catch(() => ({}));
  try {
    const r = await objaviZadruzniZadatak(session.user.id, id, body);
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
