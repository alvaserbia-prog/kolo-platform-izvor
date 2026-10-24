import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { dodajZadrugara, ZadrugaGreska } from "@/lib/protokol/zadruga";

/** POST — povezivanje naloga sa zadrugom (Pravilnik o zadrugama čl. 7). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  let body: { pseudonim?: unknown; imePrezime?: unknown; pristanak?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  try {
    const r = await dodajZadrugara(session.user.id, id, {
      pseudonim: body.pseudonim,
      imePrezime: body.imePrezime,
      pristanak: body.pristanak,
    });
    // U dnevnik ide pseudonim, ne ime: dnevnik se ne briše sa svojstvom zadrugara.
    await logAdminAkcija(session.user.id, "ZADRUGAR_POVEZAN", id, r.pseudonim);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
