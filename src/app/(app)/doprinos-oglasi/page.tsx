import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DoprinosOglasiKlijent from "./DoprinosOglasiKlijent";

export default async function DoprinosOglasiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [oglasiRaw, mojePrijaveRaw] = await Promise.all([
    prisma.doprinosOglas.findMany({
      where: { status: "ACTIVE" },
      include: {
        createdBy: { select: { pseudonim: true } },
        krug: { select: { name: true } },
        _count: { select: { prijave: { where: { status: "APPROVED" } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.oglasPrijava.findMany({
      where: { userId: session.user.id },
      select: { oglasId: true, status: true },
    }),
  ]);

  const prijaveMap = Object.fromEntries(mojePrijaveRaw.map((p) => [p.oglasId, p.status]));

  const oglasi = oglasiRaw.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    source: o.source as string,
    predlozeniPoen: o.predlozeniPoen,
    saOdobravanjem: o.saOdobravanjem,
    positions: o.positions,
    deadline: o.deadline?.toISOString() ?? null,
    createdByPseudonim: o.createdBy.pseudonim,
    krugName: o.krug?.name ?? null,
    odobreniClanovi: o._count.prijave,
    createdAt: o.createdAt.toISOString(),
    mojaPrijava: (prijaveMap[o.id] ?? null) as string | null,
  }));

  return (
    <DoprinosOglasiKlijent
      oglasi={oglasi}
      isVerified={session.user.verified}
    />
  );
}
