import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  DecaGreska,
  mojeDeteIliBaci,
  obrisiNalogDeteta,
  postaviDozvolu,
} from "@/lib/protokol/deca";

/**
 * PATCH /api/deca/[id] — prekidač iz čl. 20 st. 2.
 *
 * Jedina saglasnost koju roditelj daje posle otvaranja naloga: komunikacija i
 * razmena maloletnog korisnika sa punoletnim korisnicima. Povlači se istim putem.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  let body: { dozvolaOdrasli?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (typeof body.dozvolaOdrasli !== "boolean") {
    return await greska("Neispravan zahtev.", 400);
  }

  try {
    return NextResponse.json(await postaviDozvolu(session.user.id, id, body.dozvolaOdrasli));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}

/**
 * DELETE /api/deca/[id] — brisanje naloga deteta (čl. 36).
 *
 * Traži da roditelj otkuca pseudonim deteta: klik ne sme da promaši red u spisku,
 * a radnja poništava sav POEN i uklanja sve oglase. Isti obrazac kao kod vraćanja
 * naloga na dan registracije u admin panelu.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  let potvrda = "";
  try {
    const body = await req.json();
    potvrda = typeof body?.pseudonim === "string" ? body.pseudonim.trim() : "";
  } catch {
    /* telo je obavezno, provera je ispod */
  }

  try {
    const { pseudonim } = await mojeDeteIliBaci(session.user.id, id);
    if (potvrda.toLowerCase() !== pseudonim.toLowerCase()) {
      return await greska("Za brisanje naloga otkucaj pseudonim deteta.", 400);
    }
    return NextResponse.json(await obrisiNalogDeteta(session.user.id, id));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
