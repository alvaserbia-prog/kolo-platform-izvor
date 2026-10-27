/**
 * POST /api/zahtev-razgovor/[id]/gazdinstvo — jedan razgovor (Pravilnik o
 * gazdinstvima čl. 8 st. 2; set 4.8.3). Član Kola koji je otvorio poziv nosioca sa
 * spiska beleži i da je razgovor radi odobrenja gazdinstva obavljen.
 * Body: { sumnja: boolean } — posle razgovora postoji osnov za sumnju (čl. 8 st. 4).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";
import { GazdinstvoGreska, zabeleziRazgovorSaSpiska } from "@/lib/protokol/gazdinstvo";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  let body: { sumnja?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* prazno telo = bez sumnje */
  }
  const z = await prisma.zahtevZaRazgovor.findUnique({ where: { id }, select: { userId: true } });
  if (!z) return await greska("Ova osoba više nije na spisku.", 404);
  try {
    await zabeleziRazgovorSaSpiska(session.user.id, z.userId, body.sumnja === true);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    console.error("[POST /api/zahtev-razgovor/[id]/gazdinstvo]", e);
    return await greska("Greška.", 500);
  }
}
