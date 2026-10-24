/**
 * Spisak povezanih (Pravilnik o dokazu stvarnosti čl. 5d; set 4.8.3).
 *
 * GET  — spisak za prijavljenog člana Kola: pseudonim i smer (NANIZE: koga je uveo
 *        dok je bio član bez potvrde; NAVISE: ko je njega uveo). Prazan za ostale.
 * POST { userId, potvrdaPoznavanja } — potvrda označene osobe. Svaka je posebna lična
 *        potvrda: dnevni tempo, nadzor, bez POEN-a.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import {
  potvrdiSaSpiskaPovezanih,
  spisakPovezanihZa,
  VerifikacijaGreska,
} from "@/lib/protokol/verifikacija-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nisi prijavljen.", 401);
  const lista = await spisakPovezanihZa(session.user.id);
  return NextResponse.json({ povezani: lista.map((p) => ({ id: p.userId, pseudonim: p.pseudonim, smer: p.smer })) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nisi prijavljen.", 401);
  let body: { userId?: unknown; potvrdaPoznavanja?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Nevažeći JSON.", 400);
  }
  if (typeof body.userId !== "string" || !body.userId) return await greska("Nedostaje osoba.", 400);
  try {
    const rez = await potvrdiSaSpiskaPovezanih(session.user.id, body.userId, body.potvrdaPoznavanja === true);
    return NextResponse.json({
      verifikovaniPseudonim: rez.verifikovaniPseudonim,
      upozorenjeDnevno: rez.upozorenjeDnevno,
    });
  } catch (e) {
    if (e instanceof VerifikacijaGreska) return await greska(e.message, e.statusCode);
    console.error("[POST /api/verifikacija/povezani]", e);
    return await greska("Greška servera", 500);
  }
}
