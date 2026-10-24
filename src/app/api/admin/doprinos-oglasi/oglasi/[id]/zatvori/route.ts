import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/doprinos-oglasi/oglasi/[id]/zatvori
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const oglas = await prisma.doprinosOglas.update({ where: { id }, data: { status: "CLOSED" } });
  await logAdminAkcija(session.user.id, "DOPRINOS_OGLAS_ZATVOREN", id, oglas.title);
  return NextResponse.json({ ok: true });
}
