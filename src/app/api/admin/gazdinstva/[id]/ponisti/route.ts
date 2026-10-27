import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { ponistiZbogLazneIzjave, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST { razlog, iskljuci: userId[] } — poništenje odobrenja zbog lažne izjave (čl. 20):
 * otpis doprinosa gazdinstva svim članovima iz perioda izjave (i u minus), a
 * isključenje samo označenima — ko je lagao ili znao (čl. 20 st. 3; U5). Samo superadmin.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeSuperadmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const rezultat = await ponistiZbogLazneIzjave(session.user.id, id, body?.razlog, body?.iskljuci);
    return NextResponse.json({ ok: true, rezultat: rezultat ?? null });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
