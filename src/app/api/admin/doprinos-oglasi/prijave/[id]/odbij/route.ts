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
 * POST /api/admin/doprinos-oglasi/prijave/[id]/odbij
 * Odbijanje prijave za operativni doprinos (čl. 36 Pravilnika v3.7.0).
 * Faza 1: UO Fondacije (admin). Faza 2: čuvari Kola (operativni čl. 16).
 */
export async function POST(
  req: NextRequest,
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
    return await greska("Odlučivanje o prijavi dostupno je samo čuvarima Kola i Fondaciji (čl. 36).", 403);
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const razlog = typeof body.razlog === "string" ? body.razlog.trim() : "";

  const prijava = await prisma.oglasPrijava.findUnique({
    where: { id },
    include: { oglas: { select: { createdById: true } } },
  });
  if (!prijava) return await greska("Prijava nije pronađena.", 404);
  if (prijava.status !== "PENDING") return await greska("Prijava nije na čekanju.", 400);

  // Konflikt interesa: verifikator ne sme biti podnosilac prijave ni predlagač oglasa.
  // Izuzetak: superadmin sme da odlučuje i na svom oglasu (vidi odobri/route.ts).
  if (session.user.id === prijava.userId) {
    return await greska("Ne možeš odlučivati o sopstvenoj prijavi.", 403);
  }
  if (!jeSuperadmin(session.user) && session.user.id === prijava.oglas.createdById) {
    return await greska("Predlagač oglasa ne može odlučivati o prijavama na svoj oglas.", 403);
  }

  await prisma.oglasPrijava.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: razlog || null },
  });

  const oglas = await prisma.doprinosOglas.findUnique({ where: { id: prijava.oglasId }, select: { title: true } });

  await logAdminAkcija(session.user.id, "DOPRINOS_PRIJAVA_ODBIJENA", prijava.userId,
    `${oglas?.title ?? prijava.oglasId}${razlog ? ": " + razlog : ""}`);

  await obavesti(prijava.userId, {
    tip: "info",
    kljuc: razlog
      ? "notifikacije.prijava_zadatak_odbijena_razlog"
      : "notifikacije.prijava_zadatak_odbijena",
    parametri: { zadatak: oglas?.title ?? "", razlog: razlog ?? "" },
    naslov: "Prijava za zadatak odbijena",
    tekst: `Tvoja prijava za zadatak „${oglas?.title ?? ""}" je odbijena.${razlog ? ` Razlog: ${razlog}` : ""}`,
    link: "/programi",
  });

  return NextResponse.json({ ok: true });
}
