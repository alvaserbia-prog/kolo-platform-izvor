import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { potvrdiRealizaciju, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * POST /api/vauceri/realizacija — davalac potvrđuje da je dobro predato, odnosno
 * usluga pružena (nabavke čl. 30g st. 1). Potvrđuje podnosilac prijave ILI njegov
 * aktivan zaposleni — niko drugi (`potvrdiRealizaciju` → `ovlascenjeKorisnika`);
 * ko je potvrdio, beleži se u `Vaucer.potvrdioId`. Odgovor ne nosi podatke o imaocu.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => ({}));
  try {
    const r = await potvrdiRealizaciju(session.user.id, typeof body.kod === "string" ? body.kod : "");
    return NextResponse.json({ ok: true, opis: r.opis });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
