import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeSuperadmin } from "@/lib/dozvole";
import { ukloniParovePotvrde } from "@/lib/protokol/potvrde-parovi";

/**
 * POST /api/admin/potvrde-parovi
 *
 * Uklanjanje parova „emisija po potvrdi → usklađivanje" iz istorije (prelazna
 * radnja, odluka vlasnika 19.09.2026). Obrazloženje je u `potvrde-parovi.ts`.
 *
 * Dva koraka, oba kroz ISTU funkciju (`suviHod: true/false`) — dve odvojene
 * računice bi se razišle, pa bi čovek pritiskao dugme po brojevima koji ne važe:
 *   1. bez tela ili `{ suviHod: true }` → PREGLED, nijedno uklanjanje;
 *   2. `{ potvrda: <broj REDOVA iz pregleda> }` → SPROVOĐENJE.
 *
 * 🔴 Potvrda se OTKUCAVA, isto kao kod usklađivanja i resetovanja naloga: klik ne
 * sme da promaši, a kucanje broja tera da se pregled zaista pročita.
 *
 * 🔴 Sprovođenje NE veruje otkucanom broju nego računa iznova i poredi — između
 * dva klika prolazi vreme i istorija se menja. Ako se broj razišao, radnja staje
 * i vraća nov pregled.
 *
 * 🔴 Prepreke se proveravaju i ovde, ne samo u servisu: pregled ume da odstoji u
 * pretraživaču, pa se uslov mora ceniti u trenutku poteza.
 *
 * Samo SUPERADMIN: radnja dira istoriju svih pogođenih članova odjednom.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !jeSuperadmin(session.user)) {
    return await greska("Neautorizovano.", 401);
  }

  const body = await req.json().catch(() => ({}));
  const potvrda = typeof body?.potvrda === "number" ? body.potvrda : null;

  if (potvrda === null) {
    return NextResponse.json(await ukloniParovePotvrde({ suviHod: true }));
  }

  const pregled = await ukloniParovePotvrde({ suviHod: true });

  if (pregled.prepreke.length > 0) {
    return NextResponse.json(
      {
        error: `Radnja nije izvršena: ${pregled.prepreke.join(" ")}`,
        pregled,
      },
      { status: 409 },
    );
  }

  if (pregled.redova !== potvrda) {
    return NextResponse.json(
      {
        error:
          `Istorija se promenila otkako je pregled napravljen: sada bi se uklonilo ` +
          `${pregled.redova.toLocaleString("sr-RS")} zapisa, a potvrdio si ` +
          `${potvrda.toLocaleString("sr-RS")}. Radnja nije izvršena — pogledaj nov pregled.`,
        pregled,
      },
      { status: 409 },
    );
  }

  if (pregled.parova === 0) {
    return NextResponse.json({ error: "Nema nijednog para — nema šta da se ukloni.", pregled }, { status: 409 });
  }

  const ishod = await ukloniParovePotvrde({ suviHod: false, adminId: session.user.id });
  return NextResponse.json(ishod);
}
