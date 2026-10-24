import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { RAZLOG_OPIS, type PrijavaRazlogKod } from "@/lib/moderacija";
import type { Prisma } from "@/generated/prisma/client";

const STRANA = 40;

/**
 * GET /api/admin/pijaca — pregled oglasa za moderaciju.
 *
 * Query:
 *   ?prikaz=prijavljeni (podrazumevano) | aktivni | uklonjeni
 *   ?q=<pretraga po naslovu ili pseudonimu oglašivača>
 *
 * „Prijavljeni" je podrazumevan prikaz jer je to red čekanja: Fondacija nije
 * obavezna da unapred pregleda sadržaj (Uslovi čl. 25 st. 1), pa je prijava
 * korisnika glavni okidač moderacije.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { searchParams } = req.nextUrl;
  const prikaz = searchParams.get("prikaz") ?? "prijavljeni";
  const q = (searchParams.get("q") ?? "").trim();

  const gde: Prisma.MarketplaceListingWhereInput = {};
  if (prikaz === "uklonjeni") gde.status = "UKLONJEN";
  else if (prikaz === "aktivni") gde.status = "ACTIVE";
  else gde.prijave = { some: { status: "OTVORENA" } };

  if (q) {
    gde.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { seller: { pseudonim: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [oglasi, otvorenihPrijava] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: gde,
      // Prijavljeni idu po najstarijoj otvorenoj prijavi — red čekanja, ne po objavi.
      orderBy: prikaz === "prijavljeni" ? { createdAt: "asc" } : { createdAt: "desc" },
      take: STRANA,
      select: {
        id: true, title: true, description: true, category: true, location: true,
        status: true, images: true, createdAt: true,
        uklonjenAt: true, uklonjenRazlog: true,
        seller: { select: { id: true, pseudonim: true } },
        prijave: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true, razlog: true, opis: true, status: true, createdAt: true,
            prijavioc: { select: { pseudonim: true } },
          },
        },
      },
    }),
    prisma.prijavaOglasa.count({ where: { status: "OTVORENA" } }),
  ]);

  return NextResponse.json({
    otvorenihPrijava,
    oglasi: oglasi.map((o) => ({
      id: o.id,
      title: o.title,
      // Opis se skraćuje — panel je pregled, ceo tekst se vidi na samom oglasu.
      opis: o.description.slice(0, 400),
      category: o.category,
      location: o.location,
      status: o.status,
      slika: o.images[0] ?? null,
      createdAt: o.createdAt.toISOString(),
      uklonjenAt: o.uklonjenAt?.toISOString() ?? null,
      uklonjenRazlog: o.uklonjenRazlog,
      sellerId: o.seller.id,
      sellerPseudonim: o.seller.pseudonim,
      prijave: o.prijave.map((p) => ({
        id: p.id,
        razlog: p.razlog,
        razlogOpis: RAZLOG_OPIS[p.razlog as PrijavaRazlogKod] ?? p.razlog,
        opis: p.opis,
        status: p.status,
        prijaviocPseudonim: p.prijavioc.pseudonim,
        createdAt: p.createdAt.toISOString(),
      })),
      otvorenihPrijava: o.prijave.filter((p) => p.status === "OTVORENA").length,
    })),
  });
}
