import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  AnonimnaDonacijaGreska,
  pregledPrevodaUAnonimnu,
  prevediUAnonimnu,
} from "@/lib/protokol/donacija-anonimna";

/**
 * GET  /api/donacije/[id]/povuci-ime — pregled pre potvrde: koliko POEN-a će biti
 *      poništeno, stanje zapisa posle toga i nivo za naredne donacije.
 * POST /api/donacije/[id]/povuci-ime — prevođenje javne donacije u anonimnu.
 *
 * Adresa ostaje „povuci-ime“ (interni identifikator, CLAUDE.md pravilo 12), a značenje
 * je od seta 5.1.2 prevođenje u anonimnu (Pravilnik o pokroviteljstvu i donacijama
 * čl. 12, Politika čl. 21 st. 5): ime se briše iz liste i zapisa donacije, a doprinos
 * evidentiran po toj donaciji se poništava, i u minus (Pravilnik čl. 17 st. 2 t. 11).
 * Sva logika je u `protokol/donacija-anonimna.ts`.
 *
 * Samo SOPSTVENA, potvrđena, javna donacija; tuđa i već anonimna daju isti odgovor
 * (404) — ruta ne otkriva da li tuđa donacija postoji.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    return NextResponse.json(await pregledPrevodaUAnonimnu(session.user.id, id));
  } catch (e) {
    if (e instanceof AnonimnaDonacijaGreska) return await greska(e.message, e.status);
    throw e;
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    const ishod = await prevediUAnonimnu(session.user.id, id);
    return NextResponse.json({ ok: true, ...ishod });
  } catch (e) {
    if (e instanceof AnonimnaDonacijaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
