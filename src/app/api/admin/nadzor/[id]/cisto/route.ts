import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeSuperadmin } from "@/lib/dozvole";

// POST /api/admin/nadzor/[id]/cisto — superadmin odbacuje nalaz kao lažnu uzbunu.
// Status → CISTO; nalaz se sklanja sa spiska i 30 dana se taj subjekt ne re-obeležava.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const nalaz = await prisma.rizikNalaz.findUnique({ where: { id }, select: { status: true, pseudonim: true, tip: true } });
  if (!nalaz) return await greska("Nalaz nije pronađen.", 404);
  if (nalaz.status !== "OTVOREN") return await greska("Nalaz nije otvoren.", 400);

  await prisma.rizikNalaz.update({
    where: { id },
    data: { status: "CISTO", resenById: session.user.id, resenAt: new Date() },
  });

  await logAdminAkcija(
    session.user.id,
    "NADZOR_NALAZ_CISTO",
    id,
    `${nalaz.tip}: ${nalaz.pseudonim ?? "grupa"} — odbačeno kao lažna uzbuna`
  );

  return NextResponse.json({ ok: true });
}
