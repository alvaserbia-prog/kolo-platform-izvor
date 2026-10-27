import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { prestanakZadruge, ZadrugaGreska } from "@/lib/protokol/zadruga";

/**
 * POST — prestanak učešća zadruge (Pravilnik o zadrugama čl. 22). POEN zapisa
 * zadruge poništava se protivzapisom u korist Protokola; potez je nepovratan.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  try {
    const r = await prestanakZadruge(id);
    await logAdminAkcija(session.user.id, "ZADRUGA_PRESTANAK", id, `ponisteno ${r.ponisteno}`);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
