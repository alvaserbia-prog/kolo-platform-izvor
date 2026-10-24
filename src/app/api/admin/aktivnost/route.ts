import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";

/**
 * GET /api/admin/aktivnost — dnevnik aktivnosti korisnika (samo superadmin,
 * isto kao audit log).
 *
 * ?view=pregled — poslednja aktivnost po korisniku (kad je ko poslednji put
 *                 bio aktivan + ukupan broj zabeleženih poseta).
 * ?view=dnevnik — hronološki dnevnik poseta (podrazumevano); filteri:
 *                 ?q=<deo pseudonima>, ?pre=<ISO datum> (starije od — za
 *                 „učitaj još"), ?take=<broj, max 200>.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const params = req.nextUrl.searchParams;
  const view = params.get("view") ?? "dnevnik";

  if (view === "pregled") {
    const grupe = await prisma.aktivnostLog.groupBy({
      by: ["userId"],
      _max: { createdAt: true },
      _count: { _all: true },
    });
    grupe.sort(
      (a, b) =>
        (b._max.createdAt?.getTime() ?? 0) - (a._max.createdAt?.getTime() ?? 0),
    );
    const top = grupe.slice(0, 200);
    const korisnici = await prisma.user.findMany({
      where: { id: { in: top.map((g) => g.userId) } },
      select: { id: true, pseudonim: true },
    });
    const pseudonimPoId = new Map(korisnici.map((u) => [u.id, u.pseudonim]));
    return NextResponse.json({
      pregled: top.map((g) => ({
        userId: g.userId,
        pseudonim: pseudonimPoId.get(g.userId) ?? "?",
        poslednjaAktivnost: g._max.createdAt?.toISOString() ?? null,
        brojPoseta: g._count._all,
      })),
    });
  }

  const q = params.get("q")?.trim() || null;
  const pre = params.get("pre");
  const take = Math.min(Math.max(Number(params.get("take") ?? "100") || 100, 1), 200);

  const preDatum = pre ? new Date(pre) : null;
  const logs = await prisma.aktivnostLog.findMany({
    where: {
      ...(q ? { user: { pseudonim: { contains: q, mode: "insensitive" } } } : {}),
      ...(preDatum && !isNaN(preDatum.getTime())
        ? { createdAt: { lt: preDatum } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { pseudonim: true } } },
  });

  return NextResponse.json({
    dnevnik: logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      pseudonim: l.user.pseudonim,
      putanja: l.putanja,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
