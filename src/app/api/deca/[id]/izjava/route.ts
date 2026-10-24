import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska, dajIzjavuRoditelja, mojeDeteIliBaci } from "@/lib/protokol/deca";

/**
 * POST /api/deca/[id]/izjava
 *
 * Izjava roditelja o postojanju deteta (Pravilnik o učešću dece, čl. 6 st. 1).
 *
 * Roditelj je po pravilu daje u trenutku u kome preuzima odgovornost za nalog —
 * pri otvaranju naloga (čl. 4) ili pri preuzimanju (čl. 4b) — pa mu ova ruta ne
 * treba. Postoji zbog jedinog slučaja u kome tog trenutka nema: administrativno
 * prevođenje punoletnog naloga u maloletni (čl. 4d), gde roditelj izjavu daje po
 * prijemu odluke. Od seta 4.8.2 izjava nema rok ni posledicu po treća lica.
 *
 * 🔴 Potvrda mora da stigne izričito (`potvrda: true`). Izjava se daje pod punom
 * odgovornošću i tekst joj se snima — dugme koje šalje prazno telo bilo bi potpis
 * na dokument koji čovek nije video.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await ctx.params;

  let body: { potvrda?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (body.potvrda !== true) return await greska("Izjava mora biti potvrđena.", 400);

  try {
    await mojeDeteIliBaci(session.user.id, id);
    return NextResponse.json(await dajIzjavuRoditelja(session.user.id, id));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
