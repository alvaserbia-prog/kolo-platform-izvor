import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { DecaGreska, postaviLozinkuDeteta } from "@/lib/protokol/deca";

/**
 * POST /api/deca/[id]/lozinka — roditelj postavlja novu lozinku svom detetu.
 *
 * Zašto ruta uopšte postoji i zašto ne traži staru lozinku — vidi
 * `postaviLozinkuDeteta` u `lib/protokol/deca.ts`.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  let body: { lozinka?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  try {
    return NextResponse.json(await postaviLozinkuDeteta(session.user.id, id, body.lozinka));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
