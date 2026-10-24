import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/doprinos-oglasi — lista aktivnih oglasa
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);

  const oglasi = await prisma.doprinosOglas.findMany({
    where: { status: "ACTIVE" },
    include: {
      createdBy: { select: { pseudonim: true } },
      krug: { select: { name: true } },
      _count: { select: { prijave: { where: { status: "APPROVED" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const mojePrijave = await prisma.oglasPrijava.findMany({
    where: { userId: session.user.id },
    select: { oglasId: true, status: true },
  });

  const prijaveMap = Object.fromEntries(mojePrijave.map((p) => [p.oglasId, p.status]));

  return NextResponse.json({
    oglasi: oglasi.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      source: o.source,
      predlozeniPoen: o.predlozeniPoen,
      saOdobravanjem: o.saOdobravanjem,
      positions: o.positions,
      deadline: o.deadline?.toISOString() ?? null,
      status: o.status,
      createdByPseudonim: o.createdBy.pseudonim,
      krugName: o.krug?.name ?? null,
      odobreniClanovi: o._count.prijave,
      createdAt: o.createdAt.toISOString(),
      mojaPrijava: prijaveMap[o.id] ?? null,
    })),
  });
}
