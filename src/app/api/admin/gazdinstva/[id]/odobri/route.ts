import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { odobriGazdinstvo, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST — Fondacija odobrava gazdinstvo (Pravilnik o gazdinstvima čl. 6); članovima se
 * beleži doprinos. 🔴 Odobrenje ne potvrđuje stvarnost (čl. 4a poslednji stav, 4b st. 5).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  try {
    await odobriGazdinstvo(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
