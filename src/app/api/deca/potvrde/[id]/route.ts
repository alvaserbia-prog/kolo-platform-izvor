import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska, potvrdiPostojanje } from "@/lib/protokol/deca";

/**
 * POST /api/deca/potvrde/[id] — član Kola potvrđuje postojanje deteta roditelja
 * koga lično zna (Pravilnik o učešću dece čl. 6 st. 4; set 4.8.2). Putanja ostaje
 * iz ranijeg postupka (CLAUDE.md pravilo 12).
 *
 * Body: `{ izjava: true }` — potvrda mora biti izričita: ko potvrdi dete koje ne
 * postoji odgovara kao za lažnu verifikaciju (čl. 6 st. 6). Bez POEN-a ikome.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  let body: { izjava?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  try {
    return NextResponse.json(await potvrdiPostojanje(session.user.id, id, body.izjava === true));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
