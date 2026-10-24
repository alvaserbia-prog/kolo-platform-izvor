import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { izvrsiZrnoOperacije } from "@/lib/protokol/zrno";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/zrno/nocna — manualni okidač ZRNO operacija
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  try {
    const rezultat = await izvrsiZrnoOperacije(new Date());
    await logAdminAkcija(session.user.id, "ZRNO_NOCNA_MANUELNO");
    return NextResponse.json({ ok: true, ...rezultat });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška.";
    return await greska(msg, 500);
  }
}

// PATCH /api/admin/zrno/nocna — toggle ZRNO tržište
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const current = await prisma.zrnoKanal.findUnique({ where: { id: "singleton" } });
  const novoStanje = !(current?.isActive ?? false);

  await prisma.zrnoKanal.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", isActive: novoStanje, activatedAt: novoStanje ? new Date() : null },
    update: { isActive: novoStanje, activatedAt: novoStanje ? new Date() : undefined },
  });

  await logAdminAkcija(session.user.id, "ZRNO_TRZISTE_PROMENJENO", undefined,
    novoStanje ? "aktivirano" : "deaktivirano");

  return NextResponse.json({ ok: true, isActive: novoStanje });
}
