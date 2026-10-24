import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prijaviSe, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/nabavke/[id]/prijavi
 *
 * Prijava na objavljenu nabavku (čl. 21). Otvorena SVAKOM punoletnom korisniku sa
 * aktivnim nalogom — bez obzira koji je naziv predložio i da li je uopšte podneo
 * predlog. Prijava ne dira POEN; obaveza nastaje tek potvrdom (čl. 23).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await prijaviSe(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
