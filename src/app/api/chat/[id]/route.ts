import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatSoba } from "@/generated/prisma/client";
import { smeUSobu } from "@/lib/protokol/prijateljstva";
import { PORUKA_CEKA_RODITELJA } from "@/lib/deca-pravila";

// Autor menja i briše SOPSTVENU poruku u Pričaonici (odluka vlasnika 28.10.2026).
//
// 🔴 Izmena nema rok, ali je VIDLJIVA: uz poruku stoji „izmenjeno" (`izmenjenoAt`),
// da odgovori ne izgledaju kao da su pisani na drugi tekst. Ranije verzije teksta
// se NE čuvaju — to bi bila nova obrada, a ne izmena.
//
// 🔴 Brisanje je STVARNO (`delete`), ne meko kao uklanjanje od strane Fondacije:
// autor hoće da poruke nema, pa se sadržaj ne zadržava ni do noćnog čišćenja.
//
// Poruku koju je Fondacija već uklonila (Uslovi čl. 29 st. 2) autor ne dira: trag
// ko je i zašto uklonio ostaje do noćnog čišćenja (`/api/cron/chat-cistenje`).

async function sopstvenaPoruka(id: string, userId: string) {
  const poruka = await prisma.chatMessage.findUnique({
    where: { id },
    select: { userId: true, soba: true, uklonjenoAt: true },
  });
  if (!poruka || poruka.uklonjenoAt) return { greska: await greska("Poruka nije pronađena.", 404) };
  if (poruka.userId !== userId)
    return { greska: await greska("Možeš da menjaš i brišeš samo svoje poruke.", 403) };
  return { poruka };
}

// PATCH /api/chat/[id] — izmena teksta sopstvene poruke
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Pristup samo za prijavljene.", 401);
  }
  const { id } = await params;
  const { poruka, greska: odbijeno } = await sopstvenaPoruka(id, session.user.id);
  if (odbijeno) return odbijeno;

  // Isti uslov kao za pisanje (POST /api/chat): dete piše samo dok iza njega stoji roditelj.
  if (poruka.soba === ChatSoba.DECA && !(await smeUSobu(session.user.id))) {
    return await greska(PORUKA_CEKA_RODITELJA, 403);
  }

  const body = await req.json().catch(() => ({}));
  const content = (body.content ?? "").toString().trim();
  if (!content) {
    return await greska("Poruka ne sme biti prazna.", 400);
  }
  if (content.length > 1000) {
    return await greska("Poruka najviše 1000 znakova.", 400);
  }

  const izmenjena = await prisma.chatMessage.update({
    where: { id },
    data: { content, izmenjenoAt: new Date() },
    select: { id: true, content: true, izmenjenoAt: true },
  });

  return NextResponse.json({
    ok: true,
    poruka: {
      id: izmenjena.id,
      content: izmenjena.content,
      izmenjeno: true,
    },
  });
}

// DELETE /api/chat/[id] — brisanje sopstvene poruke
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Pristup samo za prijavljene.", 401);
  }
  const { id } = await params;
  const { greska: odbijeno } = await sopstvenaPoruka(id, session.user.id);
  if (odbijeno) return odbijeno;

  await prisma.chatMessage.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
