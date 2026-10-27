import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { imaFunkcionalniPristup } from "@/lib/protokol/pristup";
import { OperativniGreska, podnesiPrijavu } from "@/lib/protokol/operativni-postupak";

/**
 * POST /api/doprinos-oglasi/[id]/prijavi — prijava učesnika za izvršenje zadatka
 * (operativni 5.0 čl. 9–12). Plan izvršenja i izjava o pravnoj prirodi su obavezni
 * (čl. 10); kad zadatak ima kvalifikacioni filter, podnosilac navodi kako ga
 * ispunjava (čl. 9 st. 3, 11 st. 2). Posle odbijanja ili odustanka podnosi se
 * izmenjena prijava (čl. 12 st. 4) — prethodna ostaje u istoriji.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  if (!session.user.verified) return await greska("Potrebna je verifikacija.", 403);
  if (!(await imaFunkcionalniPristup(session.user.id)))
    return await greska("Potrebno je da te neko potvrdi u lancu potvrda.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const r = await podnesiPrijavu(session.user.id, id, {
      planIzvrsenja: body.planIzvrsenja,
      izjavaPotvrdjena: body.izjavaPotvrdjena,
      ispunjenostUslova: body.ispunjenostUslova,
    });
    void posaljiAdminAlert(
      r.primljen ? "Nova prijava za zadatak (primljena)" : "Nova prijava za zadatak (čeka odobrenje plana)",
      `Zadatak: ${r.naslov}\nKorisnik: ${session.user.pseudonim}`
    );
    return NextResponse.json({ ok: true, primljen: r.primljen });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
