import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/prijave-razmene?prikaz=otvorene|resene
 *
 * Spisak prijava neispunjene razmene. Uz svaku ide i TRENUTNO stanje primaoca —
 * po njemu se vidi koliko se uopšte može vratiti pre nego što se pritisne dugme
 * (zapis primaoca ne sme u minus, Pravilnik čl. 14).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const prikaz = req.nextUrl.searchParams.get("prikaz") === "resene" ? "resene" : "otvorene";

  const [stavke, ukupnoOtvorenih] = await Promise.all([
    prisma.prijavaRazmene.findMany({
      where: prikaz === "otvorene" ? { status: "OTVORENA" } : { status: { not: "OTVORENA" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        opis: true,
        status: true,
        odluka: true,
        vraceno: true,
        createdAt: true,
        resenAt: true,
        transakcija: { select: { id: true, amount: true, description: true, createdAt: true } },
        prijavioc: { select: { id: true, pseudonim: true } },
        protiv: {
          select: { id: true, pseudonim: true, tipKorisnika: true, wallet: { select: { balance: true } } },
        },
      },
    }),
    prisma.prijavaRazmene.count({ where: { status: "OTVORENA" } }),
  ]);

  return NextResponse.json({
    ukupnoOtvorenih,
    stavke: stavke.map((p) => ({
      id: p.id,
      opis: p.opis,
      status: p.status,
      odluka: p.odluka,
      vraceno: p.vraceno,
      createdAt: p.createdAt.toISOString(),
      resenAt: p.resenAt?.toISOString() ?? null,
      prepis: {
        id: p.transakcija.id,
        iznos: p.transakcija.amount,
        opis: p.transakcija.description,
        createdAt: p.transakcija.createdAt.toISOString(),
      },
      prijavioc: p.prijavioc,
      protiv: {
        id: p.protiv.id,
        pseudonim: p.protiv.pseudonim,
        tipKorisnika: p.protiv.tipKorisnika,
        // Negativno stanje (nadoknada, čl. 20b) prikazuje se kakvo jeste —
        // adminu je to podatak, ne greška.
        stanje: p.protiv.wallet?.balance ?? 0,
      },
    })),
  });
}
