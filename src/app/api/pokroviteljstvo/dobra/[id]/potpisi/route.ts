import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { potpisiUgovorDobra, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * POST /api/pokroviteljstvo/dobra/[id]/potpisi — podnosilac potpisuje ugovor na
 * platformi (donacije čl. 13g st. 4): tri potvrde i jednokratni kod sa mejla.
 * Potpisom se izdaju vaučeri i evidentira POEN (čl. 13g st. 5, čl. 13h).
 * Telo: { kod, procitao, ovlascen, saglasan }.
 *
 * 🔴 Ruta ne čita IP adresu ni zaglavlja uređaja — dokaz zaključenja su vreme i
 * kontrolni broj teksta.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const r = await potpisiUgovorDobra(
      id,
      session.user.id,
      { kod: body.kod, procitao: body.procitao, ovlascen: body.ovlascen, saglasan: body.saglasan },
      req.nextUrl.origin,
    );
    return NextResponse.json({ ok: true, brojVaucera: r.brojVaucera, kontrolniBroj: r.kontrolniBroj });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
