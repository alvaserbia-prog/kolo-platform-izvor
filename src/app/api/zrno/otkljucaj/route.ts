import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import { ucitajStatus } from "@/lib/protokol/status";
import { smeOtkljucatiZrno } from "@/lib/gornje-kolo-pravila";

// POST /api/zrno/otkljucaj — AKTIVNO → SLOBODNO (period čekanja 1 dan)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Na zahtev vraća čuvar Kola (Pravilnik čl. 23 st. 2). Kome padne potvrda, aktivno
  // ZRNO prelazi u slobodno samo od sebe (`posledicePromeneStatusa`, čl. 29 st. 2).
  const status = await ucitajStatus(session.user.id);
  if (!status || !smeOtkljucatiZrno(status))
    return await greska("Aktivno ZRNO vraća u slobodno stanje čuvar Kola.", 403);

  const stanje = await prisma.zrnoStanje.findUnique({ where: { userId: session.user.id } });
  if (!stanje || stanje.aktivno <= 0)
    return await greska("Nemate aktivnih ZRNA.", 400);

  const body = await req.json();
  const kolicina = Number(body.kolicina);
  if (!kolicina || kolicina <= 0 || !Number.isInteger(kolicina))
    return await greska("Unesite pozitivan ceo broj ZRNA.", 400);
  if (kolicina > stanje.aktivno)
    return await greska(`Imate ${stanje.aktivno} aktivnih ZRNA.`, 400);

  const danas = beogradskiDan();

  await prisma.zrnoStatusZahtev.create({
    data: { userId: session.user.id, kolicina, akcija: "OTKLJUCAJ", date: danas },
  });

  void posaljiAdminAlert(
    "Zahtev za otključavanje ZRNA",
    `Korisnik: ${session.user.pseudonim}\nKoličina: ${kolicina.toLocaleString("sr-RS")} ZRNA`
  );

  return NextResponse.json({ ok: true, poruka: "Zahtev primljen. Otključavanje se izvršava u ponoć." });
}

// DELETE /api/zrno/otkljucaj — povlačenje današnjeg zahteva (vraćanje u slobodno) pre ponoći (05.11.2026).
// Zahtev još nije izvršen, pa se ništa ne poništava u evidenciji: status prelazi u
// CANCELLED, kao kad ga Protokol otkaže. 🔴 Samo zahtev sa DANAŠNJIM datumom — noćna
// obrada izvršava zahteve do prethodnog dana, pa se povlačenje nikad ne sudara sa njom.
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const r = await prisma.zrnoStatusZahtev.updateMany({
    where: { userId: session.user.id, date: beogradskiDan(), status: "PENDING", akcija: "OTKLJUCAJ" },
    data: { status: "CANCELLED" },
  });
  if (r.count === 0) return await greska("Nema zahteva koji se danas može povući.", 404);
  return NextResponse.json({ ok: true, poruka: "Zahtev je povučen." });
}
