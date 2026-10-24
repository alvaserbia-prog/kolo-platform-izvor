import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { utvrdiParametre, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/[id]/parametri
 *   { kolicina, velicinaDela, poenPoDelu, poenObrazlozenje }
 *
 * Čl. 17 — parametre nabavke utvrđuje odluka kojom se nabavka pokreće: ukupna
 * količina, veličina jednog dela i broj POEN-a koji se poništava po delu.
 *
 * 🔴 Radnja se izvršava PRE prikupljanja ponuda. Time se tvrdnja iz čl. 19 („broj
 * POEN-a po delu nije cena dobra i ne izvodi se iz nje") ne brani rečima nego
 * redosledom: u trenutku odlučivanja dinarska cena još ne postoji.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  try {
    const n = await utvrdiParametre(id, {
      kolicina: Number(b.kolicina),
      velicinaDela: Number(b.velicinaDela),
      poenPoDelu: Number(b.poenPoDelu),
      poenObrazlozenje: String(b.poenObrazlozenje ?? ""),
    });
    await logAdminAkcija(
      session.user.id,
      "NABAVKA_PARAMETRI_UTVRDJENI",
      id,
      `količina=${n.brojJedinica}, deo=${n.velicinaDela}, delova=${n.brojDelova}, POEN po delu=${n.poenPoDelu}`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
