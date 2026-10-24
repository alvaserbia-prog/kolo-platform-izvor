import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { jeAdmin } from "@/lib/dozvole";
import { proveriRazlog, tekstObavestenjaPoruka } from "@/lib/moderacija";

// DELETE /api/admin/chat/[id] — Fondacija uklanja poruku iz Pričaonice.
//
// Uslovi čl. 25 st. 1 obuhvataju „svu drugu komunikaciju putem Platforme", a
// st. 2 daje pravo uklanjanja uz obaveštenje sa razlogom. Pričaonica je jedina
// globalna soba — bez ovoga jedini način da se sporna poruka skloni bio bi
// isključenje korisnika, što je nesrazmerno (čl. 28).
//
// Brisanje je MEKO: poruka nestaje iz sobe, a trag ko je i zašto uklonio ostaje
// dok je noćni cron ne pobriše sa ostalima starijim od 30 dana. Sadržaj poruke
// se NE prepisuje u audit log — log nosi pseudonim i razlog (audit.ts konvencije).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const provera = proveriRazlog(body.razlog);
  if (!provera.ok) return await greska(provera.greska, 400);
  const { razlog } = provera;

  const poruka = await prisma.chatMessage.findUnique({
    where: { id },
    select: { userId: true, uklonjenoAt: true, user: { select: { pseudonim: true } } },
  });
  if (!poruka) return await greska("Poruka nije pronađena.", 404);
  if (poruka.uklonjenoAt)
    return await greska("Poruka je već uklonjena.", 400);

  await prisma.chatMessage.update({
    where: { id },
    data: { uklonjenoAt: new Date(), uklonjenRazlog: razlog, uklonioId: session.user.id },
  });

  await logAdminAkcija(session.user.id, "CHAT_PORUKA_UKLONJENA", id, `${poruka.user.pseudonim}: ${razlog}`);
  await obavesti(poruka.userId, {
    tip: "CHAT_PORUKA_UKLONJENA",
    kljuc: "notifikacije.chat_uklonjena",
    parametri: { razlog },
    naslov: "Poruka uklonjena iz Pričaonice",
    tekst: tekstObavestenjaPoruka(razlog),
    link: "/pocetna",
  });

  return NextResponse.json({ ok: true });
}
