import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/doprinos-oglasi/oglasi — kreiranje oglasa
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const body = await req.json().catch(() => ({}));
  const { title, description, predlozeniPoen, obrazlozenje, saOdobravanjem, positions, deadline, krugId } = body;

  if (!title?.trim() || !description?.trim()) return await greska("Naziv i opis su obavezni.", 400);

  // Predloženi POEN — težinski koeficijent (čl. 5/6). Gornja granica po zadatku je
  // operativni parametar (čl. 26) koji utvrđuje UO/Gornje Kolo; ovde se primenjuje
  // samo zdravorazumski opseg kako bi se sprečili očigledno pogrešni unosi.
  // Polje je opciono: prazno = 0 = bez ograničenja zbira dnevnih izvršenja po izvršiocu.
  const predlozeni = predlozeniPoen === undefined || predlozeniPoen === null || predlozeniPoen === ""
    ? 0 : Number(predlozeniPoen);
  if (predlozeni !== 0 && (!Number.isInteger(predlozeni) || predlozeni < 100 || predlozeni > 10_000_000))
    return await greska("Maksimalni POEN mora biti ceo broj između 100 i 10.000.000, ili prazno (neograničeno).", 400);

  const brMesta = Number(positions ?? 1);
  if (!Number.isInteger(brMesta) || brMesta < 1 || brMesta > 1000)
    return await greska("Broj izvršilaca mora biti između 1 i 1000.", 400);

  const oglas = await prisma.doprinosOglas.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      source: "FONDACIJA", // izvor zadatka uvek Fondacija (admin = UO); selektor uklonjen iz forme
      predlozeniPoen: predlozeni,
      obrazlozenje: typeof obrazlozenje === "string" && obrazlozenje.trim() ? obrazlozenje.trim() : null,
      saOdobravanjem: Boolean(saOdobravanjem),
      positions: brMesta,
      deadline: deadline ? new Date(deadline) : null,
      krugId: krugId || null,
      createdById: session.user.id,
    },
  });

  await logAdminAkcija(session.user.id, "DOPRINOS_OGLAS_KREIRAN", oglas.id,
    `${oglas.title} (${predlozeni > 0 ? `maks ${predlozeni} POEN` : "bez maksimuma POENA"})`);

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
      saOdobravanjem: o.saOdobravanjem,
      positions: o.positions,
      deadline: o.deadline?.toISOString() ?? null,
      status: o.status,
      createdByPseudonim: o.createdBy.pseudonim,
      krugName: o.krug?.name ?? null,
      ukupnoPrijava: o._count.prijave,
      pendingEvidencija: o._count.evidencije,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
