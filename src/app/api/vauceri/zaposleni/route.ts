import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  spisakZaposlenih,
  davaociZaposlenog,
  odrediZaposlenog,
  odgovorNaGresku,
} from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * GET  /api/vauceri/zaposleni[?upisId=] — sa `upisId`: spisak zaposlenih tog upisa
 *      (samo korisniku koji vodi upis). Uvek: pokrovitelji u čije ime prijavljeni
 *      korisnik potvrđuje vaučere (samo naziv i logotip).
 * POST /api/vauceri/zaposleni — korisnik koji vodi upis određuje zaposlenog po
 *      pseudonimu: `{ upisId, pseudonim }`.
 *
 * Donacije čl. 6a i 13g st. 6, nabavke čl. 30g st. 1. Zaposleni se vezuju za UPIS.
 * 🔴 Zaposleni ne dobija ništa o ugovoru: ni opis, ni POEN, ni dokaz, ni spisak
 * drugih zaposlenih.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const ja = session.user.id;
  const upisId = req.nextUrl.searchParams.get("upisId");
  try {
    return NextResponse.json({
      zaposleni: upisId ? await spisakZaposlenih(ja, upisId) : [],
      davaoci: await davaociZaposlenog(ja),
    });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => ({}));
  try {
    const r = await odrediZaposlenog(
      session.user.id,
      typeof body.upisId === "string" ? body.upisId : "",
      typeof body.pseudonim === "string" ? body.pseudonim : "",
    );
    return NextResponse.json({ ok: true, zaposleni: r });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
