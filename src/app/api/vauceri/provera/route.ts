import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proveriKodZaDavaoca } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * POST /api/vauceri/provera — davalac unosi ili skenira kod vaučera.
 *
 * Kod proverava podnosilac prijave ugovora ILI njegov aktivan zaposleni
 * (donacije čl. 32 st. 3) — niko drugi; za ostale je kod nepoznat. Ovlašćenje
 * se utvrđuje u `proveriKodZaDavaoca` (`ovlascenjeKorisnika`). Zaposleni dobija
 * isti odgovor kao podnosilac.
 *
 * Odgovor nosi opis dobra odnosno usluge, stanje vaučera (važi / iskorišćen /
 * istekao / ne važi / nepoznat kod), rok važenja i PSEUDONIM imaoca (nabavke
 * čl. 34 st. 1, Politika čl. 29). 🔴 Ništa drugo o imaocu: ni id, ni ime, ni mejl.
 * Brana: `vaucer-izvor.test.ts`.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => ({}));
  const r = await proveriKodZaDavaoca(session.user.id, typeof body.kod === "string" ? body.kod : "");
  return NextResponse.json({ stanje: r.stanje, opis: r.opis, vaziDo: r.vaziDo, pseudonim: r.pseudonim });
}
