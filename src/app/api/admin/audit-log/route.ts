import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const take = Number(req.nextUrl.searchParams.get("take") ?? "50");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 200),
    include: { admin: { select: { pseudonim: true } } },
  });

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      adminPseudonim: l.admin.pseudonim,
      akcija: l.akcija,
      targetId: l.targetId,
      detalji: l.detalji,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
