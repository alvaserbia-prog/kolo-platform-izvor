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
 * POST /api/admin/doprinos-oglasi/evidencija/[id]/odobri
 *
 * Potvrda dnevnog izvršenja operativnog doprinosa (Pravilnik čl. 36; Pravilnik o
 * operativnom doprinosu čl. 16, 18, 22):
 *   — u Fazi 2 verifikuju čuvari Kola (operativni čl. 16);
 *   — u Fazi 1 (dok nema ZRNA) funkciju vrše članovi UO Fondacije (admin).
 *
 * VAŽNO: potvrda NE emituje POEN odmah. Potvrđena verifikacija (status APPROVED)
 * ulazi u raspodelu dnevnog limita na kraju obračunskog perioda, gde se evidentirani
 * POEN računa kao predloženi × min(1, L/P) (čl. 24, 25). Emisija se izvršava u
 * noćnom obračunu (`izvrsiNocnuEmisiju`).
 *
 * Konflikt interesa (čl. 16): verifikator ne sme biti predlagač zadatka niti izvršilac.
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
    return await greska("Verifikacija evidencije dostupna je samo čuvarima Kola i Fondaciji (čl. 36).", 403);
  }

  const { id } = await params;

  const ev = await prisma.oglasEvidencija.findUnique({
    where: { id },
    include: {
      oglas: { select: { title: true, createdById: true } },
    },
  });

  if (!ev) return await greska("Evidencija nije pronađena.", 404);
  if (ev.status !== "PENDING") return await greska("Evidencija nije na čekanju.", 400);

  // Konflikt interesa: verifikator ne sme biti izvršilac ni predlagač.
  // Izuzetak: superadmin sme da verifikuje i na svom zadatku (u Fazi 1 UO objavljuje
  // zadatke, pa bi zabrana blokirala jedinog verifikatora); sopstveno izvršenje ne može ni on.
  if (session.user.id === ev.userId) {
    return await greska("Ne možeš verifikovati sopstveno izvršenje.", 403);
  }
  if (!jeSuperadmin(session.user) && session.user.id === ev.oglas.createdById) {
    return await greska("Predlagač zadatka ne može verifikovati izvršenje na svom zadatku.", 403);
  }

  // Potvrda — evidencija ulazi u raspodelu narednog noćnog obračuna (čl. 22, 24, 25).
  // POEN se NE emituje sada.
  await prisma.oglasEvidencija.update({
    where: { id },
    data: { status: "APPROVED", approvedById: session.user.id, approvedAt: new Date() },
  });

  await logAdminAkcija(session.user.id, "DOPRINOS_EVIDENCIJA_ODOBRENA", ev.userId,
    `${ev.oglas.title} (predloženo ${ev.predlozeniPoen} POEN)`);

  await obavesti(ev.userId, {
    tip: "info",
    kljuc: "notifikacije.izvrsenje_potvrdjeno",
    parametri: { zadatak: ev.oglas.title, poen: ev.predlozeniPoen },
    naslov: "Izvršenje potvrđeno",
    tekst: `Tvoje dnevno izvršenje za „${ev.oglas.title}" je potvrđeno (predloženi POEN: ${ev.predlozeniPoen.toLocaleString("sr-RS")}). Evidentirani POEN se obračunava na kraju obračunskog perioda srazmerno dnevnom limitu.`,
    link: "/doprinos-oglasi",
  });

  return NextResponse.json({ ok: true, predlozeniPoen: ev.predlozeniPoen });
}
