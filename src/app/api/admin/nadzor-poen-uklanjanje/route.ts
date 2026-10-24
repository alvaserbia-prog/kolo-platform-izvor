import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeSuperadmin } from "@/lib/dozvole";
import { ukloniPoenNadzora } from "@/lib/protokol/nadzor-poen-uklanjanje";

/**
 * POST /api/admin/nadzor-poen-uklanjanje
 *
 * Uklanjanje POEN-a za nadzor iz evidencije (prelazna radnja uz dokaz stvarnosti
 * 4.7.5, odluka vlasnika 18.10.2026). Obrazloženje je u `nadzor-poen-uklanjanje.ts`.
 *
 * Isti obrazac kao `potvrde-parovi`:
 *   1. bez tela → PREGLED, ništa se ne menja;
 *   2. `{ potvrda: <broj POEN-a iz pregleda> }` → SPROVOĐENJE.
 *
 * 🔴 Potvrda se otkucava, a sprovođenje računa iznova i poredi — između dva klika
 * istorija ume da se promeni. Samo SUPERADMIN.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !jeSuperadmin(session.user)) {
    return await greska("Neautorizovano.", 401);
  }

  const body = await req.json().catch(() => ({}));
  const potvrda = typeof body?.potvrda === "number" ? body.potvrda : null;

  const pregled = await ukloniPoenNadzora({ suviHod: true });
  if (potvrda === null) return NextResponse.json(pregled);

  if (pregled.prepreke.length > 0) {
    return NextResponse.json(
      { error: `Radnja nije izvršena: ${pregled.prepreke.join(" ")}`, pregled },
      { status: 409 },
    );
  }
  if (pregled.poen !== potvrda) {
    return NextResponse.json(
      {
        error:
          `Stanje se promenilo otkako je pregled napravljen: sada bi se skinulo ` +
          `${pregled.poen.toLocaleString("sr-RS")} POEN-a, a potvrdio si ` +
          `${potvrda.toLocaleString("sr-RS")}. Radnja nije izvršena — pogledaj nov pregled.`,
        pregled,
      },
      { status: 409 },
    );
  }

  const ishod = await ukloniPoenNadzora({ suviHod: false, adminId: session.user.id });
  return NextResponse.json(ishod);
}
