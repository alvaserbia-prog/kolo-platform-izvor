import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dajIzjavuOAdresi, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST — izjava člana koji upravlja da je saglasan da se adresa prikazuje uz tačku
 * na mapi (Pravilnik o gazdinstvima čl. 4 t. 3, čl. 11 st. 1), za gazdinstvo odobreno
 * pre dopune od 20.10.2026. Daje se jednom. 🔴 Nema rute za povlačenje — izlaz je
 * brisanje gazdinstva (`DELETE /api/gazdinstva/[id]`).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await dajIzjavuOAdresi(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
