import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { OperativniGreska, opozoviOvlascenje, upisiOvlascenje } from "@/lib/protokol/operativni-postupak";

/**
 * Lica koja UO ovlasti da potvrđuju izvršenje (operativni 5.0 čl. 13 st. 1, 4).
 * GET — spisak; POST `{ pseudonim, odluka, izuzetakPredlagaca }` — upis;
 * DELETE `?userId=` — opoziv. Samo superadmin (UO odlučuje, operativa upisuje).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const r = await prisma.operativnoOvlascenje.findMany({ where: { opozvanoAt: null }, orderBy: { createdAt: "desc" } });
  const korisnici = await prisma.user.findMany({ where: { id: { in: r.map((x) => x.userId) } }, select: { id: true, pseudonim: true } });
  return NextResponse.json({
    ovlascenja: r.map((x) => ({
      userId: x.userId,
      pseudonim: korisnici.find((k) => k.id === x.userId)?.pseudonim ?? null,
      odluka: x.odluka,
      izuzetakPredlagaca: x.izuzetakPredlagaca,
      od: x.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const body = await req.json().catch(() => ({}));
  try {
    await upisiOvlascenje(session.user.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return await greska("Nedostaje korisnik.", 400);
  await opozoviOvlascenje(session.user.id, userId);
  return NextResponse.json({ ok: true });
}
