import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { ponistiZbogLazneIzjave, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/** POST — poništenje odobrenja zbog lažne izjave (čl. 12): otpis (i u minus) i isključenje svih članova. Samo superadmin — isključenje je njegova odluka. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeSuperadmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const rezultat = await ponistiZbogLazneIzjave(session.user.id, id, body?.razlog);
    return NextResponse.json({ ok: true, rezultat: rezultat ?? null });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
