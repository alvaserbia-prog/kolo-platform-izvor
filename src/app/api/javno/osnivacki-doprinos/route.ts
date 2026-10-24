import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dohvatiStatusKanala } from "@/lib/protokol/osnivacki";

/**
 * GET /api/javno/osnivacki-doprinos
 * Status kanala + log koraka (agregat) dostupni su svima radi transparentnosti.
 * Lista osnivaca sa PSEUDONIMIMA i udelima vraca se iskljucivo verifikovanim
 * korisnicima (Pravilnik o osnivackom doprinosu cl. 12 — „javnost udela" znaci
 * prema zajednici verifikovanih, ne prema eksternoj javnosti).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const verifikovan = !!session?.user?.verified;

    const [status, osnivaci, koraci] = await Promise.all([
      dohvatiStatusKanala(),
      verifikovan
        ? prisma.osnivac.findMany({
            select: {
              redniBroj: true,
              udeoBrojilac: true,
              udeoImenilac: true,
              napomena: true,
              user: { select: { pseudonim: true } },
            },
            orderBy: { redniBroj: "asc" },
          })
        : Promise.resolve(null),
      prisma.osnivackiKorakLog.findMany({
        select: {
          brojKoraka: true,
          prag: true,
          ukupanPoenUSistemu: true,
          iznosKoraka: true,
          createdAt: true,
        },
        orderBy: { brojKoraka: "desc" },
        take: 20, // poslednjih 20 koraka
      }),
    ]);

    return NextResponse.json({ status, osnivaci, poslednjikoraci: koraci });
  } catch (e) {
    return await greska(String(e), 500);
  }
}
