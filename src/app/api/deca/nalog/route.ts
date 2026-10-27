import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { DecaGreska } from "@/lib/protokol/deca";
import { obrisiSopstveniNalogNaCekanju } from "@/lib/protokol/deca-poziv";

/**
 * DELETE /api/deca/nalog — maloletni korisnik briše sopstveni nalog koji čeka
 * preuzimanje (Pravilnik o učešću dece, čl. 8 st. 3).
 *
 * Zašto zasebna ruta, a ne `DELETE /api/profil`: taj tok nalog ANONIMIZUJE i
 * čuva ga kao zapis (čl. 33 Pravilnika o KOLO sistemu), a ovde nalog treba da
 * NESTANE — u razdoblju pre pristanka nema šta da se čuva.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  try {
    await obrisiSopstveniNalogNaCekanju(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
