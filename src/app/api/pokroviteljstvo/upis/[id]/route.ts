import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { razresiNaselje } from "@/lib/naselje";
import { procitajLogoUrl } from "@/lib/protokol/logotip-pokrovitelja";
import { izmeniUpis, obrisiUpis, odgovorNaGreskuUpisa } from "@/lib/protokol/upis-pokrovitelja";

/**
 * PATCH  /api/pokroviteljstvo/upis/[id] — izmena upisa (donacije čl. 18 st. 2):
 *        kontakt, sedište i mapa odmah; naziv, MB i logotip na ponovnu proveru.
 * DELETE /api/pokroviteljstvo/upis/[id] — brisanje upisa (čl. 18 st. 4), samo kad
 *        pokrovitelj nema ugovor sa neiskorišćenim vaučerima. Telo
 *        `{ ukloniSaRangListe: true }` — na zahtev korisnika pokrovitelj se uklanja i
 *        sa rang-liste; bez toga doprinosi ostaju na rang-listi.
 *
 * Samo korisnik koji vodi upis. 🔴 Nema rute kojom se „povlači" izjava o adresi.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return await greska("Neispravan zahtev.", 400);
  if (body.logoUrl !== undefined) {
    const logo = procitajLogoUrl(body.logoUrl);
    if (!logo.ok) return await greska(logo.razlog, 400);
  }
  try {
    await izmeniUpis(id, session.user.id, body, razresiNaselje(body.mapaMesto));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuUpisa(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await obrisiUpis(id, session.user.id, body?.ukloniSaRangListe === true);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuUpisa(e);
  }
}
