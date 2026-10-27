import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { OperativniGreska, objaviZadruzniZadatak } from "@/lib/protokol/operativni-postupak";

/**
 * POST — objava celine zadružnog doprinosa (operativni 5.0 čl. 23 st. 2; zadruge
 * čl. 17): Fondacija u ime zajednice, po predlogu zadruge. Bez prijave — izvršioce
 * dodeljuje zadruga. 🔴 Dok UO ne utvrdi iznos jedinice, objava se odbija.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Celinu objavljuje Fondacija.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const r = await objaviZadruzniZadatak(session.user.id, id, body);
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
