import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { glasackaMoc, poslednjiKoeficijent, polozajZrna, smeAktiviratiZrno } from "@/lib/protokol/zrno";
import { ucitajStatus } from "@/lib/protokol/status";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";

// GET /api/zrno — stanje ZRNA korisnika
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const danas = beogradskiDan();

  const [status, stanje, upisZahtev, otpisZahtev, statusZahtevi, delegacija, koeficijent, kanal] = await Promise.all([
    ucitajStatus(session.user.id),
    prisma.zrnoStanje.findUnique({ where: { userId: session.user.id } }),
    prisma.zrnoUpisZahtev.findUnique({ where: { userId_date: { userId: session.user.id, date: danas } } }),
    prisma.zrnoOtpisZahtev.findUnique({ where: { userId_date: { userId: session.user.id, date: danas } } }),
    prisma.zrnoStatusZahtev.findMany({ where: { userId: session.user.id, status: "PENDING" } }),
    prisma.zrnoDelegacija.findUnique({
      where: { delegatorId: session.user.id },
      include: { delegat: { select: { pseudonim: true } }, zakazaniDelegat: { select: { pseudonim: true } } },
    }),
    poslednjiKoeficijent(),
    prisma.zrnoKanal.findUnique({ where: { id: "singleton" } }),
  ]);

  const slobodno = stanje?.slobodno ?? 0;
  const aktivno = stanje?.aktivno ?? 0;

  return NextResponse.json({
    slobodno,
    aktivno,
    ukupno: slobodno + aktivno,
    // Set 4.8.2: glasačku moć ima samo čuvar Kola (Pravilnik čl. 29, 43).
    glasackaMoc: status && smeAktiviratiZrno(status) ? glasackaMoc(aktivno) : 0,
    polozaj: polozajZrna(status ?? "KORISNIK", slobodno + aktivno),
    koeficijent,
    kanalAktivan: kanal?.isActive ?? false,
    upisZahtev: upisZahtev ? { id: upisZahtev.id, poenIznos: upisZahtev.poenIznos, status: upisZahtev.status } : null,
    otpisZahtev: otpisZahtev ? { id: otpisZahtev.id, kolicina: otpisZahtev.kolicina, status: otpisZahtev.status } : null,
    statusZahtevi: statusZahtevi.map((z) => ({ id: z.id, kolicina: z.kolicina, akcija: z.akcija })),
    delegacija: delegacija ? {
      aktivna: delegacija.delegatId != null,
      delegatPseudonim: delegacija.delegat?.pseudonim ?? null,
      imaZakazano: delegacija.imaZakazano,
      zakazaniPseudonim: delegacija.zakazaniDelegat?.pseudonim ?? null,
    } : null,
  });
}
