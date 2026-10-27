import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dohvatiStatusKanala, vidljivostUdela } from "@/lib/protokol/osnivacki";

/**
 * GET /api/javno/osnivacki-doprinos
 * Status kanala i log koraka (zbirni podaci) dostupni su svima (Pravilnik o
 * osnivačkom doprinosu čl. 11 st. 1). Udeli iz odluke o raspodeli dostupni su
 * svim korisnicima (svako sa nalogom), a pseudonim osnivača uz udeo samo
 * učesnicima (čl. 11 st. 2; Pravilnik čl. 56). Vidljivost sprovodi server:
 * korisnik koji nije u Kolu ne dobija ni pseudonim ni napomenu.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const vidljivost = vidljivostUdela({
      prijavljen: !!session?.user,
      ucesnik: !!session?.user?.verified,
    });

    const [status, redovi, koraci] = await Promise.all([
      dohvatiStatusKanala(),
      vidljivost === "NISTA"
        ? Promise.resolve(null)
        : prisma.osnivac.findMany({
            select: {
              redniBroj: true,
              udeoBrojilac: true,
              udeoImenilac: true,
              napomena: true,
              user: { select: { pseudonim: true } },
            },
            orderBy: { redniBroj: "asc" },
          }),
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

    const osnivaci = redovi === null
      ? null
      : vidljivost === "UDELI_I_PSEUDONIM"
        ? redovi
        : redovi.map((o) => ({
            redniBroj: o.redniBroj,
            udeoBrojilac: o.udeoBrojilac,
            udeoImenilac: o.udeoImenilac,
          }));

    return NextResponse.json({ status, osnivaci, poslednjikoraci: koraci });
  } catch (e) {
    return await greska(String(e), 500);
  }
}
