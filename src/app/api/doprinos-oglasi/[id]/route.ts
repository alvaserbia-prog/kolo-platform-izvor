import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeVerifikovan, ucitajStatus } from "@/lib/protokol/status";
import { statusZadatka, zauzimaMesto } from "@/lib/operativni-pravila";
import { iskoriscenostLimita, podaciZadatkaZaUcesnike } from "@/lib/protokol/operativni-postupak";

/**
 * GET /api/doprinos-oglasi/[id]
 *
 * Operativni 5.0 čl. 25: zadatak i njegov status vidi svaki korisnik (st. 1);
 * prijave i planovi, pseudonimi izvršilaca i lica koje potvrđuje, odluke sa
 * obrazloženjima, evidentirani POEN, primedbe i iskorišćenost limita ISKLJUČIVO
 * učesnici (st. 2). Pseudonim predlagača se ne vraća nikome (#52).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);

  const { id } = await params;

  const oglas = await prisma.doprinosOglas.findUnique({
    where: { id },
    include: {
      krug: { select: { name: true } },
      prijave: { select: { userId: true, id: true, status: true, odustaoAt: true, zavrsnaOdluka: true, planIzvrsenja: true, izjavaTekst: true, rejectionReason: true, createdAt: true, aktivanKljuc: true } },
    },
  });

  if (!oglas) return await greska("Oglas nije pronađen.", 404);

  const status = await ucitajStatus(session.user.id);
  const ucesnik = status != null && jeVerifikovan(status);
  const moja = oglas.prijave.filter((p) => p.userId === session.user.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  return NextResponse.json({
    oglas: {
      id: oglas.id,
      title: oglas.title,
      description: oglas.description,
      source: oglas.source,
      zadruzni: oglas.zadruzni,
      predlozeniPoen: oglas.predlozeniPoen,
      brojCelina: oglas.brojCelina,
      opisCeline: oglas.opisCeline,
      procenaObima: oglas.procenaObima,
      obrazlozenje: oglas.obrazlozenje,
      saOdobravanjem: oglas.saOdobravanjem,
      odobravanjeObrazlozenje: oglas.odobravanjeObrazlozenje,
      kvalifikacioniUslov: oglas.kvalifikacioniUslov,
      kvalifikacioniObrazlozenje: oglas.kvalifikacioniObrazlozenje,
      positions: oglas.positions,
      deadline: oglas.deadline?.toISOString() ?? null,
      rokIzvrsenja: oglas.rokIzvrsenja?.toISOString() ?? null,
      status: oglas.status,
      statusZadatka: statusZadatka(oglas.status, oglas.prijave),
      povucenoObrazlozenje: oglas.povucenoObrazlozenje,
      obustavljeno: oglas.obustavljenoAt != null,
      krugName: oglas.krug?.name ?? null,
      odobreniClanovi: oglas.prijave.filter(zauzimaMesto).length,
      createdAt: oglas.createdAt.toISOString(),
      mojaPrijava: moja
        ? { id: moja.id, status: moja.status, ziva: moja.aktivanKljuc != null, planIzvrsenja: moja.planIzvrsenja, izjavaTekst: moja.izjavaTekst, rejectionReason: moja.rejectionReason, createdAt: moja.createdAt.toISOString() }
        : null,
    },
    zaUcesnike: ucesnik ? { ...(await podaciZadatkaZaUcesnike(id)), limit: await iskoriscenostLimita() } : null,
  });
}
