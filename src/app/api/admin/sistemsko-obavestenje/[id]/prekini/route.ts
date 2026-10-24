/**
 * POST /api/admin/sistemsko-obavestenje/[id]/prekini
 *
 * Zaustavi slanje u toku. Već poslate poruke se NE mogu povući — ovo samo
 * sprečava da se pošalje ostatku liste.
 *
 * SAMO SUPERADMIN.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const { id } = await params;

  const o = await prisma.sistemskoObavestenje.findUnique({
    where: { id },
    select: { status: true, poslato: true },
  });
  if (!o) return await greska("Obaveštenje ne postoji.", 404);
  if (o.status === "POSLATO") {
    return await greska("Slanje je već završeno.", 409);
  }

  await prisma.sistemskoObavestenje.update({
    where: { id },
    data: { status: "PREKINUTO", zavrsenoAt: new Date() },
  });

  await logAdminAkcija(
    session.user.id,
    "SISTEMSKO_OBAVESTENJE_PREKINUTO",
    id,
    `Poslato pre prekida: ${o.poslato}`
  );

  return NextResponse.json({ ok: true });
}
