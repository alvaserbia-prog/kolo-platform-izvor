import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { opisTransakcije } from "@/lib/prevod-servera";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
  const take = 50;

  const [transakcije, ukupno] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      skip: offset,
      take,
      include: {
        fromWallet: { include: { user: { select: { pseudonim: true } }, krug: { select: { name: true } } } },
        toWallet: { include: { user: { select: { pseudonim: true } }, krug: { select: { name: true } } } },
      },
    }),
    prisma.transaction.count(),
  ]);

  function walletLabel(w: { user?: { pseudonim: string } | null; krug?: { name: string } | null } | null) {
    if (!w) return "Protokol";
    if (w.user) return w.user.pseudonim;
    if (w.krug) return `[${w.krug.name}]`;
    return "Protokol";
  }

  return NextResponse.json({
    ukupno,
    transakcije: transakcije.map((t) => ({
      id: t.id,
      from: walletLabel(t.fromWallet),
      to: walletLabel(t.toWallet),
      amount: t.amount,
      type: t.type,
      // Admin panel je samo na srpskom (namespace `admin` se ne prevodi).
      description: opisTransakcije("sr", t),
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
