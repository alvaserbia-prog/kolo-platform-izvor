import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { obustaviNabavku, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/[id]/obustavi { razlog }
 *
 * Obustava nabavke. Sve rezervacije se oslobađaju, a POEN se NE gasi — poništenje
 * po čl. 27 nastupa tek u trenutku preuzimanja.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  try {
    await obustaviNabavku(id, String(b.razlog ?? ""));
    await logAdminAkcija(session.user.id, "NABAVKA_OBUSTAVLJENA", id, String(b.razlog ?? ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
