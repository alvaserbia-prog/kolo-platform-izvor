import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { proveriCelineZadatka } from "@/lib/operativni-celine-pravila";
import { proveriZadatak, traziOdobravanjePoPragu, PARAMETAR_PRAG_ODOBRAVANJA } from "@/lib/operativni-pravila";
import { vazeciParametar } from "@/lib/protokol/operativni-postupak";

// POST /api/admin/doprinos-oglasi/oglasi — objava zadatka (operativni 5.0 čl. 4–6, 12)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const body = await req.json().catch(() => ({}));
  const { title, description, poenPoCelini, brojCelina, opisCeline, procenaObima, obrazlozenje, saOdobravanjem, positions, deadline, rokIzvrsenja, kvalifikacioniUslov, kvalifikacioniObrazlozenje } = body;

  if (!title?.trim() || !description?.trim()) return await greska("Naziv i opis su obavezni.", 400);

  // Predloženi POEN se utvrđuje za jednu celinu, uz broj celina, opis celine i
  // procenu obima rada (čl. 5, 6; S1). Zadatak „bez ograničenja" (0) više ne postoji.
  const celine = proveriCelineZadatka({ poenPoCelini, brojCelina, opisCeline, procenaObima });
  if (!celine.ok) return await greska(celine.greska, 400);
  const predlozeni = celine.predlozeniPoen;

  // Čl. 5 t. 6–7, 10 (set 5.0): obrazloženje predloženog POEN-a, rok za prijavu i rok
  // za izvršenje su obavezni; kvalifikacioni filter se obrazlaže (čl. 9 st. 3).
  const ostalo = proveriZadatak({ obrazlozenje, deadline, rokIzvrsenja, kvalifikacioniUslov, kvalifikacioniObrazlozenje });
  if (!ostalo.ok) return await greska(ostalo.greska, 400);
  // Čl. 12 st. 1 t. 3 — iznad praga UO zadatak je sa odobravanjem (dok prag nije
  // utvrđen, pravilo nema dejstva).
  const poPragu = traziOdobravanjePoPragu(predlozeni, await vazeciParametar(PARAMETAR_PRAG_ODOBRAVANJA));

  const brMesta = Number(positions ?? 1);
  if (!Number.isInteger(brMesta) || brMesta < 1 || brMesta > 1000)
    return await greska("Broj izvršilaca mora biti između 1 i 1000.", 400);

  const oglas = await prisma.doprinosOglas.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      source: "FONDACIJA", // izvor zadatka uvek Fondacija (admin = UO); selektor uklonjen iz forme
      predlozeniPoen: predlozeni,
      brojCelina: celine.brojCelina,
      opisCeline: celine.opisCeline,
      procenaObima: celine.procenaObima,
      obrazlozenje: ostalo.obrazlozenje,
      saOdobravanjem: Boolean(saOdobravanjem) || poPragu,
      positions: brMesta,
      deadline: ostalo.deadline,
      rokIzvrsenja: ostalo.rokIzvrsenja,
      kvalifikacioniUslov: ostalo.kvalifikacioniUslov,
      kvalifikacioniObrazlozenje: ostalo.kvalifikacioniObrazlozenje,
      // Zadatak vezan za zadrugu je zadružni doprinos i objavljuje se samo kroz
      // /api/admin/zadruge/[id]/zadruzni (operativni 5.0 čl. 23).
      krugId: null,
      createdById: session.user.id,
    },
  });

  await logAdminAkcija(session.user.id, "DOPRINOS_OGLAS_KREIRAN", oglas.id,
    `${oglas.title} (${celine.brojCelina} × ${celine.poenPoCelini} POEN)`);

  return NextResponse.json({ ok: true, id: oglas.id });
}

// GET /api/admin/doprinos-oglasi/oglasi — lista svih oglasa
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const oglasi = await prisma.doprinosOglas.findMany({
    include: {
      createdBy: { select: { pseudonim: true } },
      krug: { select: { name: true } },
      _count: {
        select: {
          prijave: true,
          evidencije: { where: { status: "PENDING" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    oglasi: oglasi.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      obrazlozenje: o.obrazlozenje,
      source: o.source,
      predlozeniPoen: o.predlozeniPoen,
      brojCelina: o.brojCelina,
      opisCeline: o.opisCeline,
      procenaObima: o.procenaObima,
      saOdobravanjem: o.saOdobravanjem,
      positions: o.positions,
      deadline: o.deadline?.toISOString() ?? null,
      rokIzvrsenja: o.rokIzvrsenja?.toISOString() ?? null,
      kvalifikacioniUslov: o.kvalifikacioniUslov,
      kvalifikacioniObrazlozenje: o.kvalifikacioniObrazlozenje,
      zadruzni: o.zadruzni,
      obustavljeno: o.obustavljenoAt != null,
      status: o.status,
      createdByPseudonim: o.createdBy.pseudonim,
      krugName: o.krug?.name ?? null,
      ukupnoPrijava: o._count.prijave,
      pendingEvidencija: o._count.evidencije,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
