import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UKUPNO_ZRNA } from "@/lib/protokol/zrno";
import { jeAdmin } from "@/lib/dozvole";
import { brojeviClanova, brojeviStatusa } from "@/lib/admin-clanovi";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const [
    korisnici,
    statusi,
    ukupnoKrug, ukupnoKrugra,
    protokol, zrnoStanje,
    poslednjeEmisije, ukupnoTransakcija,
    noviKorisnici,
  ] = await Promise.all([
    brojeviClanova(),
    // Set 4.8.2: brojevi po statusu iz akata; deca u svojoj koloni (dete nikad nije
    // korisnik ni član).
    brojeviStatusa(),
    prisma.krug.count({ where: { status: "ACTIVE" } }),
    prisma.krugClanstvo.count({ where: { leftAt: null } }),
    prisma.wallet.findUnique({ where: { id: "banka-singleton" }, select: { balance: true } }),
    prisma.zrnoStanje.aggregate({ _sum: { slobodno: true, aktivno: true } }),
    prisma.dailyEmissionSummary.findMany({ orderBy: { date: "desc" }, take: 7 }),
    prisma.transaction.count(),
    // Rast: novi PUNOLETNI nalozi (dete se ne broji među korisnicima).
    prisma.user.findMany({
      where: { maloletan: false },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { createdAt: true },
    }),
  ]);

  const opticaj = Math.abs(protokol?.balance ?? 0);
  const zrnaKodKorisnika = (zrnoStanje._sum.slobodno ?? 0) + (zrnoStanje._sum.aktivno ?? 0);
  const zrnaUProtokolu = UKUPNO_ZRNA - zrnaKodKorisnika;

  // Grupiši nove korisnike po danu (poslednih 30 dana)
  const rastMap: Record<string, number> = {};
  for (const u of noviKorisnici) {
    const d = u.createdAt.toISOString().split("T")[0];
    rastMap[d] = (rastMap[d] ?? 0) + 1;
  }
  const rast = Object.entries(rastMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    korisnici,
    statusi,
    krugovi: { ukupno: ukupnoKrug, krugra: ukupnoKrugra },
    finansije: { opticaj, protokolBalance: protokol?.balance ?? 0 },
    zrno: { kodKorisnika: zrnaKodKorisnika, uProtokolu: zrnaUProtokolu, ukupno: UKUPNO_ZRNA },
    programi: poslednjeEmisije.map((e) => ({
      date: e.date.toISOString(),
      emitted: e.totalEmitted,
      requested: e.totalRequested,
      koeficijent: Number(e.koeficijent),
    })),
    ukupnoTransakcija,
    rast,
  });
}
