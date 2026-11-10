import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska, mojeDeteIliBaci, zatraziPotvrduPostojanja } from "@/lib/protokol/deca";

/**
 * POST /api/deca/[id]/potvrda-postojanja — roditelj koji je član Kola ili osnivač
 * traži potvrdu da ima ovo dete (Pravilnik o učešću dece čl. 13 st. 1; set 4.8.2).
 *
 * Za svako dete posebno, bez roka. Ponovljen zahtev vraća postojeći.
 *
 * Telo: `{ pristanak: true }` — roditelj pristaje da se uz zahtev prikažu pseudonim
 * i uzrast deteta (čl. 13 st. 2, set 5.1.2). Bez pristanka zahtev se ne podnosi.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const pristanak = body?.pristanak === true;

  try {
    await mojeDeteIliBaci(session.user.id, id);
    return NextResponse.json(await zatraziPotvrduPostojanja(session.user.id, id, pristanak));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
