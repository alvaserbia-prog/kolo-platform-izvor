import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { DoprinosStatus } from "@/generated/prisma/client";

const STRANA = 60;

/**
 * GET /api/admin/prvi-oglasi — red čekanja za odobrenje doprinosa iz čl. 40a.
 *
 * Query: ?prikaz=cekanje (podrazumevano) | odobreni
 *
 * „Na čekanju" su doprinosi naloga bez potvrde: oglas je već na Pijaci, a 1.000
 * POEN se evidentira tek kad Fondacija odobri. Prikaz „odobreni" služi proveri
 * šta je i kada odobreno — ne nudi nijednu radnju.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const prikaz = req.nextUrl.searchParams.get("prikaz") ?? "cekanje";
  const naCekanju = prikaz !== "odobreni";

  const [redovi, ukupnoNaCekanju] = await Promise.all([
    prisma.doprinosSadrzaju.findMany({
      where: { status: naCekanju ? DoprinosStatus.ZABELEZEN : DoprinosStatus.EVIDENTIRAN },
      // Na čekanju: najstariji prvi (red čekanja). Odobreni: najskoriji prvi.
      orderBy: naCekanju ? { zabelezenAt: "asc" } : { evidentiranAt: "desc" },
      take: STRANA,
      select: {
        id: true, iznos: true, status: true, okidac: true,
        zabelezenAt: true, evidentiranAt: true,
        user: { select: { id: true, pseudonim: true, tipKorisnika: true, createdAt: true } },
        oglas: {
          select: {
            id: true, title: true, description: true, category: true,
            location: true, status: true, images: true, createdAt: true,
          },
        },
      },
    }),
    prisma.doprinosSadrzaju.count({ where: { status: DoprinosStatus.ZABELEZEN } }),
  ]);

  return NextResponse.json({
    ukupnoNaCekanju,
    stavke: redovi.map((d) => ({
      id: d.id,
      iznos: d.iznos,
      status: d.status,
      okidac: d.okidac,
      zabelezenAt: d.zabelezenAt.toISOString(),
      evidentiranAt: d.evidentiranAt?.toISOString() ?? null,
      korisnik: {
        id: d.user.id,
        pseudonim: d.user.pseudonim,
        tipKorisnika: d.user.tipKorisnika,
        createdAt: d.user.createdAt.toISOString(),
      },
      // Oglas može da nedostaje: veza je SetNull, pa činjenica doprinosa preživljava
      // brisanje oglasa. Tab tada prikazuje samo korisnika.
      oglas: d.oglas
        ? {
            id: d.oglas.id,
            title: d.oglas.title,
            // Panel je pregled — ceo tekst se čita na samom oglasu.
            opis: d.oglas.description.slice(0, 400),
            category: d.oglas.category,
            location: d.oglas.location,
            status: d.oglas.status,
            brojSlika: d.oglas.images.length,
            createdAt: d.oglas.createdAt.toISOString(),
          }
        : null,
    })),
  });
}
