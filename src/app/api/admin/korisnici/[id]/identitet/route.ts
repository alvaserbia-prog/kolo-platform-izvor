import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { ispraviIdentitet, procitajImePrezime } from "@/lib/protokol/identitet";

/**
 * POST — ispravka imena u evidenciji identiteta po prigovoru vrste „Ispravka
 * podatka" (Pravilnik čl. 31 st. 3, Uslovi čl. 40 st. 2 t. 11). Samo superadmin.
 * 🔴 U audit log ide samo činjenica ispravke — ime ne (konvencija `audit.ts`).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ime = procitajImePrezime(body?.imePrezime);
  if (!ime.ok) return await greska(ime.razlog, 400);

  const postoji = await prisma.identitetNaloga.findUnique({ where: { userId: id }, select: { id: true } });
  if (!postoji) return await greska("Uz ovaj nalog nema upisanog imena.", 404);

  await ispraviIdentitet(id, ime.imePrezime);
  await logAdminAkcija(session.user.id, "IDENTITET_ISPRAVLJEN", id, "Ispravka po prigovoru „Ispravka podatka“");
  return NextResponse.json({ ok: true });
}
