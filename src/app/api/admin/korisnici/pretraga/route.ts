import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/korisnici/pretraga?q=
 *
 * Izbor punoletnog naloga u administrativnim radnjama (za sada: roditelj pri
 * prevođenju naloga u maloletni). Namerno NIJE ista ruta kao `/api/korisnici/pretraga`:
 *
 *  - ta ruta izbacuje SOPSTVENI nalog iz rezultata, jer služi da se nađe neko
 *    drugi; ovde admin sme da izabere sebe (roditelj svog deteta je čest slučaj);
 *  - traži i po NAPUŠTENIM pseudonimima, pa se nalog nađe i kad se pamti staro
 *    ime — to je bio i povod: pseudonim se u međuvremenu promenio, a tačno
 *    poklapanje po ukucanom imenu nije nalazilo ništa.
 *
 * Maloletni nalozi se ne vraćaju — maloletni korisnik ne može biti roditelj.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  // Napušteni pseudonimi vode na svog vlasnika (`PseudonimIstorija`), pa se prvo
  // skupe ID-evi naloga koji su to ime nekad nosili.
  const stari = await prisma.pseudonimIstorija.findMany({
    where: { pseudonim: { contains: q, mode: "insensitive" } },
    select: { userId: true, pseudonim: true },
    take: 20,
  });
  const stariPoId = new Map(stari.map((s) => [s.userId, s.pseudonim]));

  const korisnici = await prisma.user.findMany({
    where: {
      OR: [
        { pseudonim: { contains: q, mode: "insensitive" } },
        ...(stariPoId.size > 0 ? [{ id: { in: [...stariPoId.keys()] } }] : []),
      ],
      status: { not: "EXCLUDED" },
      deaktiviranAt: null,
      maloletan: false,
    },
    select: { id: true, pseudonim: true, verified: true, indeksStvarnosti: true },
    take: 10,
    orderBy: { pseudonim: "asc" },
  });

  return NextResponse.json(
    korisnici.map((k) => ({
      ...k,
      // Kad je nalog nađen po starom imenu, ono se prikazuje uz aktuelno — inače
      // čovek ne vidi zašto mu je taj nalog uopšte ponuđen.
      staroIme: stariPoId.get(k.id) ?? null,
    })),
  );
}
