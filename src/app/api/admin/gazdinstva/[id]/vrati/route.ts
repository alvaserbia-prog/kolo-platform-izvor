import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { vratiGazdinstvo, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/** POST — vraćanje prijave na dopunu, uz razlog (čl. 6 st. 2). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const rezultat = await vratiGazdinstvo(session.user.id, id, body?.razlog);
    return NextResponse.json({ ok: true, rezultat: rezultat ?? null });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
