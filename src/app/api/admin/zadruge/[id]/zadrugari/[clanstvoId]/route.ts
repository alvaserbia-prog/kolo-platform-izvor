import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { smeRaditiZaZadrugu } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { ukloniZadrugara, ZadrugaGreska } from "@/lib/protokol/zadruga";

/** DELETE — prestanak svojstva zadrugara (Pravilnik o zadrugama čl. 8). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; clanstvoId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true, adminZadrugaId: true } });
  const { id, clanstvoId } = await params;
  // Admin u svakoj zadruzi, zadružni admin samo u svojoj (zadruge čl. 15; U2).
  if (!smeRaditiZaZadrugu(me, id)) return await greska("Nemate ovlašćenje.", 403);
  try {
    await ukloniZadrugara(id, clanstvoId);
    await logAdminAkcija(session.user.id, "ZADRUGAR_UKLONJEN", id, clanstvoId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
