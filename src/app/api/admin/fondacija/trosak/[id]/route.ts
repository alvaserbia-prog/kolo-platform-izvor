import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { azurirajVetoStatus } from "@/lib/protokol/fondacija";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

/**
 * DELETE /api/admin/fondacija/trosak/[id]
 * Brisanje troska. Po Pravilniku transparentnosti, brisanje treba biti redak slucaj
 * (npr. ispravljanje greske u unosu). Audit log preporucljiv.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeAdmin(session.user)) return await greska("Samo admin.", 403);

  const { id } = await params;
  const trosak = await prisma.fondacijaTrosak.delete({ where: { id } });
  await azurirajVetoStatus();
  await logAdminAkcija(session.user.id, "FONDACIJA_TROSAK_OBRISAN", id,
    `${trosak.kategorija}: ${Number(trosak.iznosRSD)} RSD — ${trosak.opis}`);
  return NextResponse.json({ ok: true });
}
