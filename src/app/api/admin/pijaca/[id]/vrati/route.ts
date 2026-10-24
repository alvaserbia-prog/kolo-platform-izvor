import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { jeAdmin } from "@/lib/dozvole";

// POST /api/admin/pijaca/[id]/vrati — poništenje uklanjanja.
//
// Postoji zato što je uklanjanje jednostrana odluka Fondacije: pogrešnu procenu
// i usvojen prigovor (Uslovi čl. 30) mora biti moguće ispraviti bez traženja od
// korisnika da ponovo kuca oglas.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const oglas = await prisma.marketplaceListing.findUnique({
    where: { id },
    select: { title: true, status: true, sellerId: true, seller: { select: { pseudonim: true } } },
  });
  if (!oglas) return await greska("Oglas nije pronađen.", 404);
  if (oglas.status !== "UKLONJEN")
    return await greska("Oglas nije uklonjen.", 400);

  await prisma.marketplaceListing.update({
    where: { id },
    data: { status: "ACTIVE", uklonjenAt: null, uklonjenRazlog: null, uklonioId: null },
  });

  await logAdminAkcija(session.user.id, "OGLAS_VRACEN", id, `${oglas.seller.pseudonim} — ${oglas.title}`);
  await obavesti(oglas.sellerId, {
    tip: "OGLAS_VRACEN",
    kljuc: "notifikacije.oglas_vracen",
    parametri: { oglas: oglas.title },
    naslov: "Oglas vraćen na Pijacu",
    tekst: `Tvoj oglas „${oglas.title}" je vraćen i ponovo je vidljiv na Pijaci.`,
    link: `/pijaca/${id}`,
  });

  return NextResponse.json({ ok: true });
}
