import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/javno/fondacija/troskovi
 * Javna lista svih troskova Fondacije (transparentnost).
 * Query: ?kategorija=PLATA&page=1&pageSize=50
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const kategorija = url.searchParams.get("kategorija");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "50")));

  const where = kategorija ? { kategorija: kategorija as never } : {};

  const [troskovi, ukupno] = await Promise.all([
    prisma.fondacijaTrosak.findMany({
      where,
      select: {
        id: true,
        datum: true,
        iznosRSD: true,
        kategorija: true,
        opis: true,
        dokumentUrl: true,
        createdAt: true,
        kreirao: { select: { pseudonim: true } },
      },
      orderBy: { datum: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.fondacijaTrosak.count({ where }),
  ]);

  return NextResponse.json({
    troskovi: troskovi.map((t) => ({
      ...t,
      iznosRSD: Number(t.iznosRSD),
    })),
    ukupno,
    page,
    pageSize,
  });
}
