import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { zatvoriPrijaveIUtvrdiRed, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/[id]/zatvori-prijave
 *
 * Ručno zatvaranje prijava pre isteka roka; isto radi i noćni posao po isteku
 * (čl. 22). Snima se broj POEN-a i mesto u redu, pa se šalju prvi pozivi.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  try {
    const broj = await zatvoriPrijaveIUtvrdiRed(id);
    await logAdminAkcija(session.user.id, "NABAVKA_RED_UTVRDJEN", id, `${broj} u redu`);
    return NextResponse.json({ ok: true, uRedu: broj });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
