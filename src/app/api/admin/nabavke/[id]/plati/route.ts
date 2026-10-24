import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { zabeleziPlacanje, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/[id]/plati { iznosRSD }
 *
 * Beleži plaćanje dobavljaču i otvara period preuzimanja (čl. 25).
 *
 * 🔴 Plaća se TEK sada, kad je poznato koliko je delova potvrđeno — ako je
 * potvrđeno manje od broja delova iz kalkulacije, kupuje se manje jedinica i plaća
 * srazmerno manje; veličina dela se ne menja.
 *
 * 🔴 Odliv ide u `ProjekatTrosak`, ne u `FondacijaTrosak`: prag za gašenje
 * zaštitnog veta je tri OPERATIVNA troška prethodnog meseca, pa bi nabavka upisana
 * kao operativa podigla prag i veto bi se najteže gasio baš kad Fondacija radi.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const iznos = Number(b.iznosRSD);
  if (!Number.isFinite(iznos) || iznos <= 0) return await greska("Unesite plaćen iznos u dinarima.", 400);

  try {
    await zabeleziPlacanje(id, iznos, session.user.id);
    await logAdminAkcija(session.user.id, "NABAVKA_PLACENA", id, `${iznos} RSD`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
