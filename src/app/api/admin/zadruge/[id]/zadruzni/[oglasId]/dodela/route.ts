import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { smeRaditiZaZadrugu } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { OperativniGreska, dodeliCelinu } from "@/lib/protokol/operativni-postupak";

/**
 * POST — dodela celine zadružnog doprinosa zadrugaru (operativni 5.0 čl. 23 st. 2;
 * zadruge čl. 15, 17 st. 2): `{ pseudonim }`. Izvršioca određuje zadruga; upisuje
 * ga lice koje radi u ime zadruge ili administratorski tim. Lice koje dodeljuje ne
 * potvrđuje izvršenje (čl. 23 st. 5).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string; oglasId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true, adminZadrugaId: true } });
  const { id, oglasId } = await params;
  if (!smeRaditiZaZadrugu(me, id)) return await greska("Nemate ovlašćenje.", 403);
  const body = await req.json().catch(() => ({}));
  try {
    await dodeliCelinu(session.user.id, id, oglasId, body.pseudonim);
    await logAdminAkcija(session.user.id, "ZADRUZNI_DOPRINOS_DODELA", oglasId, String(body.pseudonim ?? ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
