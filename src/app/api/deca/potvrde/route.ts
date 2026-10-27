import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { zahteviPostojanjaZaPotvrdu } from "@/lib/protokol/deca";

/**
 * GET /api/deca/potvrde — zahtevi za potvrdu postojanja deteta koje prijavljeni
 * član Kola vidi na stranici Potvrde (Pravilnik o učešću dece čl. 13 st. 2; set 4.8.2).
 * Putanja ostaje iz ranijeg postupka (CLAUDE.md pravilo 12).
 *
 * 🔴 Vidi ih SAMO član Kola ili osnivač; član bez potvrde, korisnik i dete dobijaju
 * 403 (čl. 13 st. 2–3). Odgovor nosi ISKLJUČIVO pseudonim roditelja — ni
 * pseudonim, ni uzrast, ni pol, ni školu deteta.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!session.user.potvrdjen || session.user.maloletan) {
    return await greska("Zahteve za potvrdu postojanja deteta vide članovi Kola.", 403);
  }
  return NextResponse.json({ zahtevi: await zahteviPostojanjaZaPotvrdu(session.user.id) });
}
