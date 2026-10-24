import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { izracunajLevak, type LevakUlaz } from "@/lib/levak";

/**
 * GET /api/admin/levak — levak: gde ljudi otpadaju od registracije do oglasa.
 *
 * Samo superadmin, kao i dnevnik aktivnosti iz kog se dva koraka izvode.
 * Vraća isključivo AGREGATE (brojeve), nijedan pseudonim ni id.
 *
 * Vraća sve periode (ukupno, poslednjih 7 i 30 dana, pojedinačne nedelje i
 * mesece) u jednom pozivu — skup podataka je mali (korisnici + oglasi), pa je
 * jedan upit po izabranom periodu bio čist gubitak: prikaz bira red iz onoga
 * što već ima, bez ijednog novog zahteva.
 *
 * Dva koraka („otvorili poverenje", „otvorili formu za oglas") čitaju se iz
 * `AktivnostLog`, koji postoji tek od uvođenja dnevnika i čuva 12 meseci —
 * zato se vraća i `aktivnostOd`, pa prikaz može da označi kohorte starije od
 * tog datuma, gde ta dva koraka nužno pokazuju nulu.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return NextResponse.json({ error: "Pristup odbijen." }, { status: 403 });

  const [korisnici, poverenjeRedovi, formaRedovi, oglasi, najstarijaAktivnost] =
    await Promise.all([
      prisma.user.findMany({
        // Maloletni korisnici ne prolaze ovaj put — nalog im otvara roditelj i ne
        // potvrđuju se u lancu potvrda. Da ulaze u levak, iskrivili bi svaki korak,
        // jer bi zauvek stajali na „registrovani".
        where: { maloletan: false },
        select: { id: true, createdAt: true, verifiedAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Stara putanja `/tabla-jemstva` se i dalje broji: tabla je ukinuta, ali
      // istorijske posete postojećih kohorti ostaju deo njihovog puta.
      prisma.aktivnostLog.groupBy({
        by: ["userId"],
        where: {
          OR: [
            { putanja: { startsWith: "/verifikacija" } },
            { putanja: { startsWith: "/tabla-jemstva" } },
          ],
        },
      }),
      prisma.aktivnostLog.groupBy({
        by: ["userId"],
        where: { putanja: { startsWith: "/pijaca/novi-oglas" } },
      }),
      // Svi oglasi, uključujući prodate/uklonjene — pitanje je da li je čovek
      // ikad objavio oglas, ne da li je oglas i danas aktivan.
      prisma.marketplaceListing.findMany({
        select: { sellerId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.aktivnostLog.findFirst({
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);

  // Oglasi su sortirani rastuće, pa prvi upis po prodavcu i jeste prvi oglas.
  const prviOglas = new Map<string, Date>();
  for (const o of oglasi) {
    if (!prviOglas.has(o.sellerId)) prviOglas.set(o.sellerId, o.createdAt);
  }

  const ulaz: LevakUlaz = {
    korisnici,
    otvoriliPoverenje: new Set(poverenjeRedovi.map((r) => r.userId)),
    otvoriliFormu: new Set(formaRedovi.map((r) => r.userId)),
    prviOglas,
  };

  return NextResponse.json({
    // `sada` se prosleđuje izričito, da pomerajući prozori (poslednjih 7 i 30
    // dana) mere od jednog trenutka za sve grupe u istom odgovoru.
    grupe: izracunajLevak(ulaz, { sada: new Date() }),
    aktivnostOd: najstarijaAktivnost?.createdAt.toISOString() ?? null,
  });
}
