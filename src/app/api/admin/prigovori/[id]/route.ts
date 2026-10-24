import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { posaljiNotifikaciju } from "@/lib/notifikacije";
import { jeAdmin } from "@/lib/dozvole";
import { ispraviEvidencijuNabavke } from "@/lib/protokol/nabavka-ispravka";

/**
 * PATCH /api/admin/prigovori/[id] — odgovori na prigovor
 * Body: { status: "RESENO" | "ODBIJENO" | "U_OBRADI", odgovor: string, ispravi?: boolean }
 *
 * `ispravi` važi samo za vrstu **NABAVKA** (nabavke čl. 30a st. 5): uz usvojen
 * prigovor otklanja se poništenje zapisa POEN-a izvršeno pri preuzimanju. Radnja
 * stoji ovde, a ne u zasebnom tabu, da se o jednom slučaju ne bi odlučivalo na
 * dva mesta — isti razlog iz kog odluka o prepisu zatvara i prigovor uz sebe.
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
  const ispravi = body.ispravi === true;

  const validStatusi = ["U_OBRADI", "RESENO", "ODBIJENO"];
  if (!validStatusi.includes(status)) {
    return await greska("Nevalidan status.", 400);
  }

  const prigovor = await prisma.prigovorNaOdluku.findUnique({
    where: { id },
    include: { user: { select: { pseudonim: true } } },
  });
  if (!prigovor) return await greska("Prigovor nije pronađen.", 404);

  // Ispravka evidencije ide PRE zatvaranja prigovora: ako padne, prigovor ostaje
  // otvoren i vidi se da odluka nije sprovedena.
  if (ispravi) {
    if (prigovor.tipOdluke !== "NABAVKA" || !prigovor.predmetId)
      return await greska("Ispravka evidencije moguća je samo po prigovoru na deo iz nabavke.", 400);
    const ishod = await ispraviEvidencijuNabavke(
      prigovor.predmetId,
      session.user.id,
      odgovor?.trim() ?? "",
    );
    if (!ishod.ok) return await greska(ishod.razlog, 400);
  }

  await prisma.prigovorNaOdluku.update({
    where: { id },
    data: {
      status,
      odgovor: odgovor?.trim() || null,
      odgovorioId: session.user.id,
      odgovorioAt: new Date(),
    },
  });

  await logAdminAkcija(
    session.user.id,
    "PRIGOVOR_ODGOVOR",
    prigovor.userId,
    `Prigovor ${id} → ${status}`
  );

  if (status === "RESENO" || status === "ODBIJENO") {
    const reseno = status === "RESENO";
    const rucniOdgovor = odgovor?.trim();
    const koren = reseno ? "notifikacije.prigovor_resen" : "notifikacije.prigovor_odbijen";
    await posaljiNotifikaciju(
      prigovor.userId,
      "info",
      reseno ? "Prigovor rešen" : "Prigovor odbijen",
      rucniOdgovor || (reseno ? "Tvoj prigovor je rešen." : "Tvoj prigovor je odbijen."),
      "/profil",
      // Obrazloženje koje je UO otkucao je autorski tekst i ide kako je napisano —
      // zato se BEZ ključa, pa se ne prevodi. Samo standardna rečenica je prevodiva.
      rucniOdgovor ? undefined : { kljuc: koren },
    );
  }

  return NextResponse.json({ ok: true });
}
