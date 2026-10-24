import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gdePseudonim } from "@/lib/pseudonim";
import { ucitajStatus } from "@/lib/protokol/status";
import { smeDelegirati } from "@/lib/gornje-kolo-pravila";

// POST /api/zrno/delegiraj — delegiraj glasove
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Delegira samo čuvar Kola (Pravilnik čl. 47; Gornje Kolo čl. 14).
  const mojStatus = await ucitajStatus(session.user.id);
  if (!mojStatus || !smeDelegirati(mojStatus, mojStatus))
    return await greska("Glas delegira samo čuvar Kola.", 403);

  const body = await req.json();
  const delegatPseudonim = (body.pseudonim ?? "").trim();
  if (!delegatPseudonim)
    return await greska("Unesite pseudonim delegata.", 400);

  const delegat = await prisma.user.findFirst({ where: gdePseudonim(delegatPseudonim), select: { id: true } });
  if (!delegat) return await greska("Korisnik nije pronađen.", 404);
  if (delegat.id === session.user.id)
    return await greska("Ne možete delegirati sebi.", 400);
  // Delegat je takođe čuvar Kola; član bez potvrde glas ni ne prima (Gornje Kolo čl. 14).
  const delegatStatus = await ucitajStatus(delegat.id);
  if (!delegatStatus || !smeDelegirati(mojStatus, delegatStatus))
    return await greska("Glas se delegira samo drugom čuvaru Kola.", 400);

  // Zakazana promena — stupa na snagu u ponoć (efektivna delegacija ostaje do tada).
  await prisma.zrnoDelegacija.upsert({
    where: { delegatorId: session.user.id },
    create: { delegatorId: session.user.id, delegatId: null, zakazaniDelegatId: delegat.id, imaZakazano: true },
    update: { zakazaniDelegatId: delegat.id, imaZakazano: true },
  });

  return NextResponse.json({ ok: true, poruka: "Delegacija primljena. Stupa na snagu u ponoć." });
}

// DELETE /api/zrno/delegiraj — zakaži opoziv delegacije (izvršava se u ponoć)
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const postoji = await prisma.zrnoDelegacija.findUnique({ where: { delegatorId: session.user.id } });
  if (!postoji) return NextResponse.json({ ok: true });

  await prisma.zrnoDelegacija.update({
    where: { delegatorId: session.user.id },
    data: { zakazaniDelegatId: null, imaZakazano: true },
  });

  return NextResponse.json({ ok: true, poruka: "Opoziv primljen. Stupa na snagu u ponoć." });
}
