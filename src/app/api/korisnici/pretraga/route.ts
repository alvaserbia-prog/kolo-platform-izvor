import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { smeProsireno } from "@/lib/dozvole";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { IZBOR_STATUSA, statusUcesnika } from "@/lib/protokol/status";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // V2: pretraga otkriva pseudonime — dostupna samo korisnicima sa punim pristupom
  // (verifikovan, indeks ≥ 10%). Neverifikovani ne smeju da vide pseudonime drugih.
  if (!smeProsireno(session.user)) {
    return await greska("Verifikacija potrebna.", 403);
  }
  // Anti-scraping: 30 pretraga u 10s po korisniku.
  if (!rateLimit(`pretraga:${session.user.id}`, 30, 10_000).ok) {
    return NextResponse.json([], { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const korisnici = await prisma.user.findMany({
    where: {
      pseudonim: { contains: q, mode: "insensitive" },
      status: { not: "EXCLUDED" },
      id: { not: session.user.id },
      // Maloletni korisnici se ne pojavljuju u pretrazi članova (Modul Deca, čl. 13).
      // Do njih se dolazi kroz njihov oglas, ne pretraživanjem po imenu.
      maloletan: false,
    },
    select: {
      id: true,
      pseudonim: true,
      // Status (set 4.8.2) za `OznakaStatusa`. Maloletni su gore isključeni, pa
      // stanje deteta ovde nije potrebno.
      ...IZBOR_STATUSA,
      // `location` se NE vraća u pretrazi — privatan podatak; vidljiv samo na profilu
      // po togglu vidljivosti.
    },
    take: 10,
    orderBy: { pseudonim: "asc" },
  });

  return NextResponse.json(
    korisnici.map((k) => ({ id: k.id, pseudonim: k.pseudonim, status: statusUcesnika(k) })),
  );
}
