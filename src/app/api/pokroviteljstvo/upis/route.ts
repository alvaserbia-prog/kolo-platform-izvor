import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prevedi } from "@/lib/prevod-servera";
import { razresiNaselje } from "@/lib/naselje";
import { jePravniOblik } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { kljuceviIzjavaUpisa } from "@/lib/upis-pokrovitelja-pravila";
import { procitajLogoUrl } from "@/lib/protokol/logotip-pokrovitelja";
import { davaociZaposlenog } from "@/lib/protokol/pokroviteljstvo-dobrima";
import { mojiUpisi, upisiPokrovitelja, odgovorNaGreskuUpisa } from "@/lib/protokol/upis-pokrovitelja";

/**
 * GET  /api/pokroviteljstvo/upis — upisi koje prijavljeni korisnik vodi i pokrovitelji
 *      za koje potvrđuje vaučere.
 * POST /api/pokroviteljstvo/upis — upis pokrovitelja u evidenciju (donacije čl. 6a).
 *
 * 🔴 Izjava o prikazu adrese na mapi je obavezna i ne povlači se (čl. 6a st. 2);
 * izlaz je brisanje upisa (`DELETE /api/pokroviteljstvo/upis/[id]`).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const [upisi, davaoci] = await Promise.all([mojiUpisi(session.user.id), davaociZaposlenog(session.user.id)]);
  return NextResponse.json({ upisi, davaoci });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return await greska("Neispravan zahtev.", 400);

  const logo = procitajLogoUrl(body.logoUrl);
  if (!logo.ok) return await greska(logo.razlog, 400);
  // Tekst potvrde o evidentiranju (čl. 6a st. 3) — SKLOPLJEN NA SERVERU iz istog
  // ključa iz kog ga ekran prikazuje, na jeziku na kom je prikazan, i snima se.
  const jezik = await getLocale();
  const oblik = body.vrsta !== "GAZDINSTVO" && jePravniOblik(body.pravniOblik) ? body.pravniOblik : null;
  const potvrdaTekst = prevedi(jezik, `postaniPokrovitelj.${kljuceviIzjavaUpisa(oblik).potvrda}`);
  try {
    const u = await upisiPokrovitelja(session.user.id, body, {
      mesto: razresiNaselje(body.mapaMesto),
      logoUrl: logo.url,
      potvrdaTekst,
    });
    return NextResponse.json({ ok: true, id: u.id }, { status: 201 });
  } catch (e) {
    return await odgovorNaGreskuUpisa(e);
  }
}
