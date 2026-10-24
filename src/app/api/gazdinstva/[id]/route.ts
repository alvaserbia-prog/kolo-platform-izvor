import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { izmeniGazdinstvo, izmeniOpis, obrisiGazdinstvo, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * PATCH — izmena prijave dok nije odobrena (Pravilnik o gazdinstvima čl. 4, 6; podatke
 * iz čl. 4 t. 1–3 menja samo lice koje odgovara za izjavu, čl. 9 st. 2), odnosno
 * `{ samoOpis: true, opis }` — opis gazdinstva menja svaki član koji upravlja (čl. 9 st. 1).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return await greska("Neispravan zahtev.", 400);
  try {
    if ((body as { samoOpis?: unknown }).samoOpis === true) {
      await izmeniOpis(session.user.id, id, (body as { opis?: unknown }).opis);
    } else {
      await izmeniGazdinstvo(session.user.id, id, body);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}

/**
 * DELETE — brisanje gazdinstva sa platforme (Pravilnik o gazdinstvima čl. 11 st. 5–6):
 * samo lice koje odgovara za izjavu, i samo kad gazdinstvo nema ugovor o
 * pokroviteljstvu dobrima i uslugama sa neiskorišćenim vaučerima. Gazdinstvo sa
 * drugim članovima se ne briše — zahtev ima dejstvo istupanja (`ishod: "ISTUPIO"`).
 * Brisanjem gazdinstvo prestaje: zabeležen doprinos se poništava, evidentiran otpisuje (čl. 12a).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    const { ishod } = await obrisiGazdinstvo(session.user.id, id);
    return NextResponse.json({ ok: true, ishod });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
