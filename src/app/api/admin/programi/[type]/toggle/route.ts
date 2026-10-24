import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType } from "@/generated/prisma/client";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/programi/[type]/toggle — aktiviraj/deaktiviraj program
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { type } = await params;
  const programType = type as ProgramType;

  const current = await prisma.protokolProgram.findUnique({ where: { type: programType } });
  const novoStanje = !(current?.isActive ?? false);

  await prisma.protokolProgram.upsert({
    where: { type: programType },
    create: { type: programType, isActive: novoStanje, activatedAt: novoStanje ? new Date() : null },
    update: { isActive: novoStanje, activatedAt: novoStanje ? new Date() : undefined },
  });

  await logAdminAkcija(session.user.id, "PROGRAM_STATUS_PROMENJEN", programType,
    novoStanje ? "aktiviran" : "deaktiviran");

  return NextResponse.json({ ok: true, isActive: novoStanje });
}
