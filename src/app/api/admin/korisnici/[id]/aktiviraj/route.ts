import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeSuperadmin } from "@/lib/dozvole";
import { preracunajStatusNaloga, posledicePromeneStatusa } from "@/lib/protokol/status";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const korisnik = await prisma.user.findUnique({ where: { id }, select: { status: true, pseudonim: true } });
  if (!korisnik) return await greska("Korisnik nije pronađen.", 404);

  // Vraćanje isključenog naloga (npr. po prigovoru, Uslovi čl. 28 st. 2) vraća i
  // status iz grafa: isključenje je ugasilo keš statusa (`prestaoStatus`), a veze su
  // ostale. Ugašen nalog (`deaktiviranAt`) ostaje bez statusa i posle ovoga.
  const promena = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
    });
    return preracunajStatusNaloga(tx, id);
  });
  try {
    await posledicePromeneStatusa(id, promena.pre, promena.posle);
  } catch (e) {
    console.error("[aktiviraj] posledice promene statusa", id, e);
  }

  await logAdminAkcija(session.user.id, "KORISNIK_AKTIVIRAN", id, korisnik.pseudonim);
  return NextResponse.json({ ok: true });
}
