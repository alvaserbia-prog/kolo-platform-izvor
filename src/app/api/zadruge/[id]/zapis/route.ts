import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { zapisUZadrugu, jeOsnovUZapis, procitajIznos, ZadrugaGreska } from "@/lib/protokol/zadruga";

/**
 * POST — zadrugar prepisuje POEN u zapis svoje zadruge, uz osnov (Pravilnik o
 * zadrugama čl. 11 st. 1, 3): izdato dobro iz raspodele, korišćenje opreme, usluga zadruge.
 * Pokreće ga sam zadrugar — POEN se iz tuđeg zapisa ne skida bez njegove radnje.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  let body: { osnov?: unknown; iznos?: unknown; opis?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (!jeOsnovUZapis(body.osnov)) return await greska("Nepoznat osnov zapisa.", 400);
  const iznos = procitajIznos(body.iznos);
  if (!iznos) return await greska("Iznos mora biti pozitivan ceo broj.", 400);
  try {
    await zapisUZadrugu(session.user.id, id, { osnov: body.osnov, iznos, opis: body.opis });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
