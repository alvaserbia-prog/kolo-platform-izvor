import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { oznaciRazgovor, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST — Fondacija je pre odobrenja razgovarala sa NOSIOCEM gazdinstva (Pravilnik o
 * gazdinstvima čl. 6a, set 4.8.2). Sa ostalim članovima se po tom članu ne razgovara.
 * Beleži se samo da je razgovor obavljen; broj se briše odlukom o prijavi.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  try {
    await oznaciRazgovor(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
