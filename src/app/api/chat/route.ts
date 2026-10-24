import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatSoba } from "@/generated/prisma/client";
import { smeUSobu } from "@/lib/protokol/prijateljstva";
import { sobaKorisnika, usloviSobe } from "@/lib/protokol/pricaonica";
import { PORUKA_CEKA_RODITELJA } from "@/lib/deca-pravila";

// GET /api/chat — poslednje poruke (samo prijavljeni)
// Query: ?since=ISO-datum (opciono) — vraća samo poruke nakon datog vremena
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Pristup samo za prijavljene.", 401);
  }

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 200);

  const soba = await sobaKorisnika(session.user.id);
  // `null` znači da korisnik sobu ne vidi uopšte — nalog deteta koje još čeka
  // roditelja (čl. 4c). Vraća se prazna soba, a ekran deteta objašnjava zašto i
  // šta mu to otvara.
  const uslovi = await usloviSobe(session.user.id, soba);
  if (!uslovi) {
    return NextResponse.json([]);
  }

  const poruke = await prisma.chatMessage.findMany({
    where: { ...uslovi, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, pseudonim: true, verified: true, avatar: true } } },
  });

  return NextResponse.json(
    poruke
      .map((p) => ({
        id: p.id,
        userId: p.user.id,
        pseudonim: p.user.pseudonim,
        verified: p.user.verified,
        avatar: p.user.avatar,
        content: p.content,
        createdAt: p.createdAt.toISOString(),
      }))
      .reverse()
  );
}

// POST /api/chat — slanje poruke (samo verifikovani)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Pristup samo za prijavljene.", 401);
  }
  // 🔴 Dete piše u svojoj sobi BEZ ikakve potvrde. Uslov „samo potvrđeni" je pisan
  // za sobu odraslih; preneseno na decu, dečja soba bi zauvek bila samo za čitanje,
  // jer maloletni korisnik potvrdu nikad ne stiče (Modul Deca, čl. 15).
  const soba = await sobaKorisnika(session.user.id);
  // Od seta 4.8.1 (odluka vlasnika 20.10.2026) u sobi odraslih piše i nov član, bez
  // ograničenja: Pričaonica je mesto upoznavanja, a upoznavanje je put do potvrde
  // (Uslovi čl. 16 st. 5). Moderacija ostaje ista.
  // Zato što potvrde nema, uslov za dečju sobu je STANJE NALOGA: iza deteta mora da
  // stoji roditelj koji je sam prošao registraciju (čl. 18 st. 2). Bez toga bi se
  // odrastao čovek predstavio kao dvanaestogodišnjak bez ijedne prepreke — ranije je
  // taj rizik hvatalo roditeljsko čitanje razgovora, koje je ukinuto.
  if (soba === ChatSoba.DECA && !(await smeUSobu(session.user.id))) {
    return await greska(PORUKA_CEKA_RODITELJA, 403);
  }

  const body = await req.json();
  const content = (body.content ?? "").toString().trim();

  if (!content) {
    return await greska("Poruka ne sme biti prazna.", 400);
  }
  if (content.length > 1000) {
    return await greska("Poruka najviše 1000 znakova.", 400);
  }

  const poruka = await prisma.chatMessage.create({
    data: {
      userId: session.user.id,
      content,
      soba,
    },
    include: { user: { select: { id: true, pseudonim: true, verified: true, avatar: true } } },
  });

  return NextResponse.json({
    ok: true,
    poruka: {
      id: poruka.id,
      userId: poruka.user.id,
      pseudonim: poruka.user.pseudonim,
      verified: poruka.user.verified,
      avatar: poruka.user.avatar,
      content: poruka.content,
      createdAt: poruka.createdAt.toISOString(),
    },
  });
}
