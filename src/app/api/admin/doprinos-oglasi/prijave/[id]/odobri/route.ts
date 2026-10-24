import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { jeCuvar, ucitajStatus } from "@/lib/protokol/status";

/**
 * POST /api/admin/doprinos-oglasi/prijave/[id]/odobri
 *
 * Odobrenje prijave za operativni doprinos (čl. 36 Pravilnika v3.7.0).
 * Faza 1: UO Fondacije (admin). Faza 2: čuvari Kola (operativni čl. 16).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const korisnikJeAdmin = jeAdmin(session.user);
  // Set 4.8.2 (operativni čl. 16): pored Fondacije verifikuje ČUVAR KOLA — potvrđen
  // i drži ZRNO. Član bez potvrde sa ZRNOM (REGULARNI) i korisnik kome je ZRNO
  // zamrznuto ne verifikuju; status se čita iz jezgra statusa, ne iz same kolone.
  let jeCuvarKola = false;
  if (!korisnikJeAdmin) {
    const mojStatus = await ucitajStatus(session.user.id);
    jeCuvarKola = mojStatus != null && jeCuvar(mojStatus);
  }
  if (!korisnikJeAdmin && !jeCuvarKola) {
    return await greska("Odobrenje prijave dostupno je samo čuvarima Kola i Fondaciji (čl. 36).", 403);
  }

  const { id } = await params;
  const prijava = await prisma.oglasPrijava.findUnique({ where: { id } });
  if (!prijava) return await greska("Prijava nije pronađena.", 404);
  if (prijava.status !== "PENDING") return await greska("Prijava nije na čekanju.", 400);

  const oglasSaKapacitetom = await prisma.doprinosOglas.findUnique({
    where: { id: prijava.oglasId },
    select: {
      title: true,
      positions: true,
      createdById: true,
      _count: { select: { prijave: { where: { status: "APPROVED" } } } },
    },
  });
  if (!oglasSaKapacitetom) return await greska("Oglas nije pronađen.", 404);

  // Konflikt interesa: verifikator ne sme biti predlagač oglasa ni podnosilac prijave.
  // Izuzetak: superadmin sme da odlučuje i na svom oglasu (u Fazi 1 UO objavljuje
  // zadatke, pa bi zabrana blokirala jedinog verifikatora).
  if (session.user.id === prijava.userId) {
    return await greska("Ne možeš odlučivati o sopstvenoj prijavi.", 403);
  }
  if (!jeSuperadmin(session.user) && session.user.id === oglasSaKapacitetom.createdById) {
    return await greska("Predlagač oglasa ne može odlučivati o prijavama na svoj oglas.", 403);
  }

  if (
    oglasSaKapacitetom.positions !== null &&
    oglasSaKapacitetom._count.prijave >= oglasSaKapacitetom.positions
  ) {
    return NextResponse.json(
      { error: `Oglas je popunjen — sva mesta su zauzeta (${oglasSaKapacitetom.positions}).` },
      { status: 400 }
    );
  }

  await prisma.oglasPrijava.update({
    where: { id },
    data: { status: "APPROVED", approvedById: session.user.id, approvedAt: new Date() },
  });

  await logAdminAkcija(session.user.id, "DOPRINOS_PRIJAVA_ODOBRENA", prijava.userId,
    oglasSaKapacitetom.title);

  await obavesti(prijava.userId, {
    tip: "info",
    kljuc: "notifikacije.prijava_zadatak_prihvacena",
    parametri: { zadatak: oglasSaKapacitetom.title },
    naslov: "Prijava za zadatak prihvaćena!",
    tekst: `Tvoja prijava za zadatak „${oglasSaKapacitetom.title}" je prihvaćena. Možeš da počneš sa evidencijom izvršenja.`,
    link: "/programi",
  });

  return NextResponse.json({ ok: true });
}
