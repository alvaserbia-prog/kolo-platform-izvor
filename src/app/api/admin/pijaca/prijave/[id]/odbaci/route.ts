import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeAdmin } from "@/lib/dozvole";

// POST /api/admin/pijaca/prijave/[id]/odbaci — prijava pregledana, povrede nema.
//
// Oglas ostaje na Pijaci. Prijavilac se NE obaveštava: obaveza obaveštavanja iz
// Uslova čl. 25 st. 2 vezana je za uklanjanje sadržaja, a povratna informacija
// o tuđem oglasu bi otkrivala ishod postupka prema trećem licu.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const prijava = await prisma.prijavaOglasa.findUnique({
    where: { id },
    select: { status: true, oglasId: true, oglas: { select: { title: true } } },
  });
  if (!prijava) return await greska("Prijava nije pronađena.", 404);
  if (prijava.status !== "OTVORENA")
    return await greska("Prijava je već rešena.", 400);

  await prisma.prijavaOglasa.update({
    where: { id },
    data: { status: "ODBACENA", resioId: session.user.id, resenoAt: new Date() },
  });

  await logAdminAkcija(session.user.id, "PRIJAVA_OGLASA_ODBACENA", prijava.oglasId, prijava.oglas.title);

  return NextResponse.json({ ok: true });
}
