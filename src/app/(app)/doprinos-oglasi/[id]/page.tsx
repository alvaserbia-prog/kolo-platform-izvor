import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OglasDetalj from "./OglasDetalj";

export default async function OglasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
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

  if (!oglas) notFound();

  return (
    <OglasDetalj
      oglas={{
        id: oglas.id,
        title: oglas.title,
        description: oglas.description,
        source: oglas.source as string,
        predlozeniPoen: oglas.predlozeniPoen,
        obrazlozenje: oglas.obrazlozenje,
        saOdobravanjem: oglas.saOdobravanjem,
        positions: oglas.positions,
        deadline: oglas.deadline?.toISOString() ?? null,
        status: oglas.status as string,
        createdByPseudonim: oglas.createdBy.pseudonim,
        krugName: oglas.krug?.name ?? null,
        odobreniClanovi: oglas._count.prijave,
        createdAt: oglas.createdAt.toISOString(),
        mojaPrijava: oglas.prijave[0]
          ? { id: oglas.prijave[0].id, status: oglas.prijave[0].status as string, planIzvrsenja: oglas.prijave[0].planIzvrsenja, izjavaTekst: oglas.prijave[0].izjavaTekst, rejectionReason: oglas.prijave[0].rejectionReason, createdAt: oglas.prijave[0].createdAt.toISOString() }
          : null,
        mojeEvidencije: oglas.evidencije.map((e) => ({
          id: e.id,
          date: e.date.toISOString(),
          predlozeniPoen: e.predlozeniPoen,
          amount: e.amount,
          dokaz: e.dokaz,
          description: e.description,
          status: e.status as string,
        })),
      }}
      isVerified={session.user.verified}
    />
  );
}
