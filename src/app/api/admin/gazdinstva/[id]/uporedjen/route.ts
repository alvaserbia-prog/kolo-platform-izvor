import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { oznaciPoredjenje, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST — Fondacija je ime i prezime nosioca, adresu i BPG iz prijave uporedila sa
 * izvodom iz Registra (Pravilnik o gazdinstvima čl. 4b st. 3). Kad se ne slažu,
 * prijava se vraća na dopunu (`/vrati`). 🔴 Poređenje ne potvrđuje stvarnost (čl. 4b st. 5).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  try {
    await oznaciPoredjenje(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
