import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/doprinos-oglasi/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);

  const { id } = await params;

  const oglas = await prisma.doprinosOglas.findUnique({
    where: { id },
    include: {
      createdBy: { select: { pseudonim: true } },
      krug: { select: { name: true } },
      prijave: {
        where: { userId: session.user.id },
        select: { id: true, status: true, planIzvrsenja: true, izjavaTekst: true, rejectionReason: true, createdAt: true },
      },
      evidencije: {
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
        take: 30,
        select: { id: true, date: true, predlozeniPoen: true, amount: true, dokaz: true, description: true, status: true },
      },
      _count: { select: { prijave: { where: { status: "APPROVED" } } } },
    },
  });

  if (!oglas) return await greska("Oglas nije pronađen.", 404);

  return NextResponse.json({
    oglas: {
      id: oglas.id,
      title: oglas.title,
      description: oglas.description,
      source: oglas.source,
      predlozeniPoen: oglas.predlozeniPoen,
      obrazlozenje: oglas.obrazlozenje,
      saOdobravanjem: oglas.saOdobravanjem,
      positions: oglas.positions,
      deadline: oglas.deadline?.toISOString() ?? null,
      status: oglas.status,
      createdByPseudonim: oglas.createdBy.pseudonim,
      krugName: oglas.krug?.name ?? null,
      odobreniClanovi: oglas._count.prijave,
      createdAt: oglas.createdAt.toISOString(),
      mojaPrijava: oglas.prijave[0]
        ? { id: oglas.prijave[0].id, status: oglas.prijave[0].status, planIzvrsenja: oglas.prijave[0].planIzvrsenja, izjavaTekst: oglas.prijave[0].izjavaTekst, rejectionReason: oglas.prijave[0].rejectionReason, createdAt: oglas.prijave[0].createdAt.toISOString() }
        : null,
      mojneEvidencije: oglas.evidencije.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        predlozeniPoen: e.predlozeniPoen,
        amount: e.amount,
        dokaz: e.dokaz,
        description: e.description,
        status: e.status,
      })),
    },
  });
}
