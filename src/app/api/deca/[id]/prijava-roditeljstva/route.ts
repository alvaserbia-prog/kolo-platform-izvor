import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { DecaGreska, prijaviRoditeljstvo } from "@/lib/protokol/deca";
import { razresiKorisnikaIzAdrese } from "@/lib/pseudonim";

/**
 * POST /api/deca/[id]/prijava-roditeljstva — prijava da lice koje je nalog deteta
 * otvorilo ili preuzelo nije njegov roditelj (Pravilnik o učešću dece čl. 17).
 * Podnosi je dete, drugi roditelj ili bilo koji drugi učesnik (st. 1).
 *
 * `[id]` je interni id deteta ili njegov pseudonim (zatvoren prikaz profila
 * deteta nosi samo pseudonim). Podnosilac nije ograničen: dete prijavljuje sa
 * svoje početne, treće lice sa profila deteta, roditelj iz podešavanja deteta.
 *
 * Body: `{ roditeljId: string, opis: string }`. Veza se po prijemu odmah
 * zaustavlja (st. 2). 🔴 Licu na koje se prijava odnosi podnosilac se ne otkriva
 * (st. 3).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id: adresa } = await ctx.params;

  const rl = rateLimit(`prijava-roditeljstva:${session.user.id}`, 5, 24 * 60 * 60 * 1000);
  if (!rl.ok) return await greska("Previše prijava u kratkom roku. Pokušaj ponovo sutra.", 429);

  let body: { roditeljId?: unknown; opis?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (typeof body.roditeljId !== "string" || typeof body.opis !== "string") {
    return await greska("Neispravan zahtev.", 400);
  }

  const deteId = await razresiKorisnikaIzAdrese(adresa);
  if (!deteId) return await greska("Nalog nije pronađen.", 404);

  const veza = await prisma.roditeljstvo.findUnique({
    where: { deteId_roditeljId: { deteId, roditeljId: body.roditeljId } },
    select: { id: true },
  });
  if (!veza) return await greska("Nalog nije pronađen.", 404);

  try {
    const r = await prijaviRoditeljstvo(session.user.id, veza.id, body.opis);
    return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
