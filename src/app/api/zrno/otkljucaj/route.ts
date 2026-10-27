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
