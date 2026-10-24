import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prevedi } from "@/lib/prevod-servera";
import { uzmiVaucer, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * POST /api/vauceri/ugovor/[id]/uzmi — korisnik uzima vaučer ugovora `id`
 * (nabavke čl. 30f). Ko prvi zatraži, dobija vaučer; reda i roka nema (čl. 30e).
 * Telo: { izjavaNepovezan, pristanakPrikaz } — oba moraju biti `true`.
 *
 * Tekst pristanka na prikaz zapisa uz pseudonim (čl. 30f st. 1) sklapa se OVDE,
 * iz istog ključa iz kog ga ekran prikazuje, na jeziku prikaza — tekst koji šalje
 * pretraživač dokazivao bi samo šta je pretraživač poslao.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const jezik = await getLocale();
  const pristanakTekst = prevedi(jezik, "vauceri.pristanak_prikaz");
  try {
    const r = await uzmiVaucer(
      session.user.id,
      id,
      { izjavaNepovezan: body.izjavaNepovezan === true, pristanakPrikaz: body.pristanakPrikaz === true },
      pristanakTekst,
    );
    return NextResponse.json({ ok: true, poen: r.poen }, { status: 201 });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
