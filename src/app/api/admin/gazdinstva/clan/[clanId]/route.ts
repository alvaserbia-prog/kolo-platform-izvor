import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { odlukaOPristupanju, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/** POST — odluka o pristupanju posle odobrenja gazdinstva (čl. 9 st. 4): { odobri, razlog }. */
export async function POST(req: Request, { params }: { params: Promise<{ clanId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { clanId } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const rezultat = await odlukaOPristupanju(session.user.id, clanId, body?.odobri === true, body?.razlog);
    return NextResponse.json({ ok: true, rezultat: rezultat ?? null });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
