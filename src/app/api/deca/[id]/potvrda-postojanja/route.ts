import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska, mojeDeteIliBaci, zatraziPotvrduPostojanja } from "@/lib/protokol/deca";

/**
 * POST /api/deca/[id]/potvrda-postojanja — roditelj koji je član Kola ili osnivač
 * traži potvrdu da ima ovo dete (Pravilnik o učešću dece čl. 6 st. 2, 8; set 4.8.2).
 *
 * Za svako dete posebno, bez roka. Ponovljen zahtev vraća postojeći.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await ctx.params;

  try {
    await mojeDeteIliBaci(session.user.id, id);
    return NextResponse.json(await zatraziPotvrduPostojanja(session.user.id, id));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
