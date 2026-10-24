import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ucitajStatus } from "@/lib/protokol/status";
import { smeUpisatiZrno } from "@/lib/gornje-kolo-pravila";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { MINIMUM_POEN_ZA_UPIS_ZRNA } from "@/lib/protokol/zrno";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";

// POST /api/zrno/upis — rezervacija upisa ZRNA (izvršava se u ponoć)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Set 4.8.2 (Pravilnik čl. 19 st. 2, 28a): ZRNO upisuje član Kola i član bez
  // potvrde; korisnik i dete ne upisuju. Član bez potvrde upisom ne postaje čuvar
  // Kola i ZRNO ne aktivira dok ne bude potvrđen. Status se čita iz baze, ne iz
  // sesije (sesija se osvežava sa zakašnjenjem).
  const status = await ucitajStatus(session.user.id);
  if (!status || !smeUpisatiZrno(status))
    return await greska("ZRNO upisuje član Kola, odnosno član bez potvrde.", 403);

  const kanal = await prisma.zrnoKanal.findUnique({ where: { id: "singleton" } });
  if (!kanal?.isActive) return await greska("Upis i otpis ZRNA još nisu aktivni.", 400);

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { balance: true } });
  if (!wallet || wallet.balance < MINIMUM_POEN_ZA_UPIS_ZRNA)
    return await greska(`Potreban minimalni balans od ${MINIMUM_POEN_ZA_UPIS_ZRNA.toLocaleString("sr-RS")} POEN.`, 400);

  const body = await req.json();
  const poenIznos = Number(body.poenIznos);
  if (!poenIznos || poenIznos <= 0)
    return await greska("Unesite pozitivan iznos POEN.", 400);

  // Max 1% balansa
  const maxPoen = Math.floor(wallet.balance * 0.01);
  if (poenIznos > maxPoen)
    return await greska(`Maksimalno ${maxPoen.toLocaleString("sr-RS")} POEN dnevno (1% balansa).`, 400);

  const danas = beogradskiDan();

  const vec = await prisma.zrnoUpisZahtev.findUnique({
    where: { userId_date: { userId: session.user.id, date: danas } },
  });
  if (vec && vec.status === "PENDING")
    return await greska("Već postoji aktivan zahtev za upis danas.", 400);

  await prisma.zrnoUpisZahtev.upsert({
    where: { userId_date: { userId: session.user.id, date: danas } },
    create: { userId: session.user.id, poenIznos, date: danas },
    update: { poenIznos, status: "PENDING" },
  });

  void posaljiAdminAlert(
    "Zahtev za upis ZRNA",
    `Korisnik: ${session.user.pseudonim}\nIznos: ${poenIznos.toLocaleString("sr-RS")} POEN`
  );

  return NextResponse.json({ ok: true, poruka: "Zahtev primljen. Biće obrađen u ponoć." });
}
