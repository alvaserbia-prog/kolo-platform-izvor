import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { zamrzniZapisZadruge, ZadrugaGreska } from "@/lib/protokol/zadruga";

/**
 * POST — upis otkaza ugovora o saradnji, odnosno pokretanja brisanja zadruge iz
 * registra (zadruge 5.0 čl. 22 st. 2; Pravilnik čl. 50 st. 4): `{ osnov }`. Od tada
 * se iz zapisa zadruge i u njega ne prepisuje i zadružni doprinos se ne evidentira.
 * Samo administratorski tim (čl. 15 st. 3).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await zamrzniZapisZadruge(id, body.osnov);
    await logAdminAkcija(session.user.id, "ZADRUGA_ZAMRZNUTA", id, String(body.osnov));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
