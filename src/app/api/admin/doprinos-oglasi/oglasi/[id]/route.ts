import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { proveriCelineZadatka } from "@/lib/operativni-celine-pravila";

// PATCH /api/admin/doprinos-oglasi/oglasi/[id] — izmena oglasa.
// Dozvoljena samo dok se niko nije prijavio (nijedna prijava, u bilo kom statusu):
// posle prve prijave uslovi pod kojima su se izvršioci prijavili ne smeju da se
// menjaju — oglas se tada zatvara i kreira novi.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;

  const oglas = await prisma.doprinosOglas.findUnique({
    where: { id },
    include: { _count: { select: { prijave: true } } },
  });
  if (!oglas) return await greska("Oglas nije pronađen.", 404);
  if (oglas.status !== "ACTIVE")
    return await greska("Zatvoren oglas ne može da se menja.", 400);
  if (oglas._count.prijave > 0)
    return await greska("Oglas ima prijave — izmena više nije moguća. Zatvorite oglas i kreirajte novi.", 400);

  const body = await req.json().catch(() => ({}));
  const { title, description, poenPoCelini, brojCelina, opisCeline, procenaObima, obrazlozenje, saOdobravanjem, positions, deadline } = body;

  if (!title?.trim() || !description?.trim())
    return await greska("Naziv i opis su obavezni.", 400);

  // Predloženi POEN se utvrđuje za jednu celinu, uz broj celina, opis celine i
  // procenu obima rada (čl. 5, 6; S1). Zadatak „bez ograničenja" (0) više ne postoji.
  const celine = proveriCelineZadatka({ poenPoCelini, brojCelina, opisCeline, procenaObima });
  if (!celine.ok) return await greska(celine.greska, 400);
  const predlozeni = celine.predlozeniPoen;

  const brMesta = Number(positions ?? 1);
  if (!Number.isInteger(brMesta) || brMesta < 1 || brMesta > 1000)
    return await greska("Broj izvršilaca mora biti između 1 i 1000.", 400);

  const izmenjen = await prisma.doprinosOglas.update({
    where: { id },
    data: {
      title: title.trim(),
      description: description.trim(),
      predlozeniPoen: predlozeni,
      brojCelina: celine.brojCelina,
      opisCeline: celine.opisCeline,
      procenaObima: celine.procenaObima,
      obrazlozenje: typeof obrazlozenje === "string" && obrazlozenje.trim() ? obrazlozenje.trim() : null,
      saOdobravanjem: Boolean(saOdobravanjem),
      positions: brMesta,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  await logAdminAkcija(session.user.id, "DOPRINOS_OGLAS_IZMENJEN", id,
    `${izmenjen.title} (${celine.brojCelina} × ${celine.poenPoCelini} POEN)`);

  return NextResponse.json({ ok: true, id });
}
