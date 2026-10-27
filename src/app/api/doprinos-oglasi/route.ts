import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusZadatka, zauzimaMesto } from "@/lib/operativni-pravila";

/**
 * GET /api/doprinos-oglasi — lista zadataka koji traju.
 *
 * Operativni 5.0 čl. 25 st. 1: svim korisnicima dostupni su zadaci sa elementima iz
 * čl. 5 i tekući status. 🔴 Pseudonim predlagača se NE vraća (#52): zadatak u Fazi 1
 * objavljuje Fondacija u ime zajednice (čl. 4 st. 3), a pseudonimi su po čl. 25
 * st. 2–3 samo za učesnike i samo za izvršioca i lice koje potvrđuje. Izvor
 * zadatka nosi `source`.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);

  const oglasi = await prisma.doprinosOglas.findMany({
    where: { status: "ACTIVE" },
    include: {
      krug: { select: { name: true } },
      prijave: { select: { status: true, odustaoAt: true, zavrsnaOdluka: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const mojePrijave = await prisma.oglasPrijava.findMany({
    where: { userId: session.user.id, aktivanKljuc: { not: null } },
    select: { oglasId: true, status: true },
  });

  const prijaveMap = Object.fromEntries(mojePrijave.map((p) => [p.oglasId, p.status]));

  return NextResponse.json({
    oglasi: oglasi.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      source: o.source,
      zadruzni: o.zadruzni,
      predlozeniPoen: o.predlozeniPoen,
      saOdobravanjem: o.saOdobravanjem,
      positions: o.positions,
      deadline: o.deadline?.toISOString() ?? null,
      rokIzvrsenja: o.rokIzvrsenja?.toISOString() ?? null,
      status: o.status,
      statusZadatka: statusZadatka(o.status, o.prijave),
      krugName: o.krug?.name ?? null,
      odobreniClanovi: o.prijave.filter(zauzimaMesto).length,
      createdAt: o.createdAt.toISOString(),
      mojaPrijava: prijaveMap[o.id] ?? null,
    })),
  });
}
