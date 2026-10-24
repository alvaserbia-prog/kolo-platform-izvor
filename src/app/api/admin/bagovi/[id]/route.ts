import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { jeAdmin } from "@/lib/dozvole";

/**
 * PATCH /api/admin/bagovi/[id] — admin menja status prijave baga
 * Body: { status: "PRIJAVLJEN" | "U_RADU" | "RESENO" | "ODBIJENO", odgovor?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nije ovlašćen.", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { status, odgovor } = body;

  const validStatusi = ["PRIJAVLJEN", "U_RADU", "RESENO", "ODBIJENO"];
  if (!validStatusi.includes(status)) {
    return await greska("Nevalidan status.", 400);
  }

  const bag = await prisma.bug.findUnique({
    where: { id },
    select: { userId: true, naslov: true },
  });
  if (!bag) return await greska("Prijava nije pronađena.", 404);

  const zatvoreno = status === "RESENO" || status === "ODBIJENO";
  await prisma.bug.update({
    where: { id },
    data: {
      status,
      odgovor: typeof odgovor === "string" ? odgovor.trim() || null : undefined,
      resenoAt: zatvoreno ? new Date() : null,
    },
  });

  await logAdminAkcija(session.user.id, "BAG_STATUS", bag.userId, `Bag ${id} → ${status}`);

  // Četiri ishoda → četiri ključa; mapa je čitljivija od ugnežđenih ternara.
  const BAG_KLJUC: Record<string, string> = {
    U_RADU: "bag_u_radu",
    RESENO: "bag_reseno",
    ODBIJENO: "bag_odbijeno",
  };
  const bagKljuc = BAG_KLJUC[status] ?? "bag_promenjen";
  const BAG_SR: Record<string, [string, string]> = {
    bag_u_radu: ["Radi se na tvojoj prijavi", `Primili smo tvoju prijavu „${bag.naslov}" i radimo na njoj.`],
    bag_reseno: ["Prijavljeni bag je rešen", `Greška iz tvoje prijave — „${bag.naslov}“ — je otklonjena. Hvala ti.`],
    bag_odbijeno: ["Prijava baga je odbijena", `Tvoja prijava „${bag.naslov}" nije prihvaćena kao greška.`],
    bag_promenjen: ["Status prijave baga je promenjen", `Status tvoje prijave „${bag.naslov}" je promenjen.`],
  };
  const [bagNaslov, bagTekst] = BAG_SR[bagKljuc];
  await obavesti(bag.userId, {
    tip: "info",
    kljuc: `notifikacije.${bagKljuc}`,
    parametri: { naslov: bag.naslov },
    naslov: bagNaslov,
    tekst: bagTekst,
    link: "/bagovi",
  });

  return NextResponse.json({ ok: true });
}
