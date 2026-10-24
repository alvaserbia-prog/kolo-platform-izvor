import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { dodajPonudu, obrisiPonudu, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST   /api/admin/nabavke/[id]/ponuda {ponudjac, cena, napomena}
 * DELETE /api/admin/nabavke/[id]/ponuda {ponudaId}
 *
 * Prikupljanje ponuda (čl. 15). Objavljuju se SVE, i one koje nisu izabrane —
 * bez toga „najpovoljnija" nije provera nego tvrdnja.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const p = await dodajPonudu(id, String(body.ponudjac ?? ""), Number(body.cena), body.napomena);
    await logAdminAkcija(session.user.id, "NABAVKA_PONUDA_DODATA", id, `${p.ponudjac} — ${p.cenaPoJedinici}`);
    return NextResponse.json({ ok: true, id: p.id });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await obrisiPonudu(String(body.ponudaId ?? ""));
    await logAdminAkcija(session.user.id, "NABAVKA_PONUDA_OBRISANA", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
