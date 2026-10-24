import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { objaviNabavku, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/[id]/objavi
 *   { ponudaId, jedinicaMere, mestoPreuzimanja, preuzimanjeOd }
 *
 * Objava kalkulacije i otvaranje prijava (čl. 20).
 *
 * 🔴 Svi brojevi se SNIMAJU na zapis: po čl. 20 st. 2 kalkulacija se posle objave
 * ne menja, a bez snimka bi se prikazani iznosi menjali sa saldom Fondacije i sa
 * tržišnom cenom — čovek koji se prijavljuje video bi druge brojeve nego onaj koji
 * je odlučivao.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const preuzimanjeOd = typeof b.preuzimanjeOd === "string" ? new Date(b.preuzimanjeOd) : null;
  if (!preuzimanjeOd || Number.isNaN(preuzimanjeOd.getTime())) {
    return await greska("Izaberite prvi dan preuzimanja.", 400);
  }
  for (const polje of ["jedinicaMere", "mestoPreuzimanja"]) {
    if (!String(b[polje] ?? "").trim()) return await greska(`Polje „${polje}" je obavezno.`, 400);
  }

  try {
    const kalk = await objaviNabavku(id, {
      ponudaId: String(b.ponudaId ?? ""),
      jedinicaMere: String(b.jedinicaMere),
      mestoPreuzimanja: String(b.mestoPreuzimanja),
      preuzimanjeOd,
    });
    await logAdminAkcija(
      session.user.id,
      "NABAVKA_OBJAVLJENA",
      id,
      `${kalk.brojDelova} delova × ${kalk.poenPoDelu} POEN; trošak ${kalk.ukupnoRSD} RSD od granice ${kalk.gornjaGranicaRSD} RSD`
    );
    return NextResponse.json({ ok: true, kalkulacija: kalk });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
