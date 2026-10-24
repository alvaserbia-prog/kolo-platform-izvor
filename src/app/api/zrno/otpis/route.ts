import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import { ucitajStatus } from "@/lib/protokol/status";
import { smeOtpisatiZrno } from "@/lib/gornje-kolo-pravila";

// POST /api/zrno/otpis — rezervacija otpisa ZRNA (izvršava se u ponoć)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Slobodno ZRNO otpisuje čuvar Kola i član bez potvrde (Pravilnik čl. 20, 21).
  // Korisniku je ZRNO zamrznuto — ne otpisuje ga dok ponovo ne bude verifikovan
  // (čl. 30 st. 3). Provera se ponavlja i pri izvršenju u ponoć.
  const status = await ucitajStatus(session.user.id);
  if (!status || !smeOtpisatiZrno(status))
    return await greska("Upisano ZRNO ti je zamrznuto dok ponovo ne budeš verifikovan.", 403);

  const kanal = await prisma.zrnoKanal.findUnique({ where: { id: "singleton" } });
  if (!kanal?.isActive) return await greska("Upis i otpis ZRNA još nisu aktivni.", 400);

  const stanje = await prisma.zrnoStanje.findUnique({ where: { userId: session.user.id } });
  if (!stanje || stanje.slobodno <= 0)
    return await greska("Nemate slobodnih ZRNA za otpis.", 400);

  const body = await req.json();
  const kolicina = Number(body.kolicina);
  if (!kolicina || kolicina <= 0 || !Number.isInteger(kolicina))
    return await greska("Unesite pozitivan ceo broj ZRNA.", 400);
  if (kolicina > stanje.slobodno)
    return await greska(`Imate ${stanje.slobodno} slobodnih ZRNA.`, 400);

  const danas = beogradskiDan();

  const vec = await prisma.zrnoOtpisZahtev.findUnique({
    where: { userId_date: { userId: session.user.id, date: danas } },
  });
  if (vec && vec.status === "PENDING")
    return await greska("Već postoji aktivan zahtev za otpis danas.", 400);

  await prisma.zrnoOtpisZahtev.upsert({
    where: { userId_date: { userId: session.user.id, date: danas } },
    create: { userId: session.user.id, kolicina, date: danas },
    update: { kolicina, status: "PENDING" },
  });

  void posaljiAdminAlert(
    "Zahtev za otpis ZRNA",
    `Korisnik: ${session.user.pseudonim}\nKoličina: ${kolicina.toLocaleString("sr-RS")} ZRNA`
  );

  return NextResponse.json({ ok: true, poruka: "Zahtev primljen. Biće obrađen u ponoć." });
}
