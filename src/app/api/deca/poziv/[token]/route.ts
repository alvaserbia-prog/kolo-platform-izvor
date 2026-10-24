import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska } from "@/lib/protokol/deca";
import {
  obrisiPoTokenu,
  odbijPoziv,
  parsirajDatumRodjenja,
  pozivPoTokenu,
  preuzmiTokenom,
} from "@/lib/protokol/deca-poziv";

/**
 * GET /api/deca/poziv/[token] — šta roditelj vidi pre nego što bilo šta uradi.
 *
 * 🔴 Vraća SAMO pseudonim deteta i stanje roka. Nikakav drugi podatak o detetu ne
 * izlazi: adresu je uneo neko treći i niko je nije proverio, pa svaki dodatni
 * podatak može da završi kod osobe koja sa detetom nema veze.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    return NextResponse.json(await pozivPoTokenu(token));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}

/**
 * POST /api/deca/poziv/[token] — tri radnje iz poruke: preuzmi, nije moje, obriši.
 *
 * `preuzmi` traži prijavu (veza mora da stoji na nečijem nalogu) i datum rođenja.
 * Druge dve rade BEZ prijave: onaj ko drži link je jedina osoba koju sistem u tom
 * trenutku može da pita, a odbijanje bez mogućnosti brisanja ostavlja tuđe dete da
 * koristi tvoju adresu dve nedelje.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let body: { akcija?: unknown; datumRodjenja?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  try {
    if (body.akcija === "odbij") return NextResponse.json(await odbijPoziv(token));
    if (body.akcija === "obrisi") return NextResponse.json(await obrisiPoTokenu(token));
    if (body.akcija !== "preuzmi") return await greska("Neispravan zahtev.", 400);

    const session = await getServerSession(authOptions);
    if (!session) return await greska("Prijavi se svojim nalogom da preuzmeš nalog deteta.", 401);

    const datum = parsirajDatumRodjenja(body.datumRodjenja);
    if (datum === undefined) return await greska("Datum rođenja nije ispravan.", 400);

    return NextResponse.json(await preuzmiTokenom(token, session.user.id, datum));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
