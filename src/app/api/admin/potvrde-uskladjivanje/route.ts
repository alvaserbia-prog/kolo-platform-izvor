import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeSuperadmin } from "@/lib/dozvole";
import { uskladiZatecenePotvrde } from "@/lib/protokol/potvrde-uskladjivanje";

/**
 * POST /api/admin/potvrde-uskladjivanje
 *
 * Jednokratno usklađivanje zatečenih potvrda sa dokazom stvarnosti čl. 7.
 *
 * Dva koraka, i oba idu kroz ISTU funkciju (`suviHod: true/false`) — dve odvojene
 * računice bi se razišle, pa bi čovek pritiskao dugme po brojevima koji ne važe:
 *   1. bez tela ili `{ suviHod: true }` → PREGLED, nijedan upis;
 *   2. `{ potvrda: <broj POEN-a iz pregleda> }` → SPROVOĐENJE.
 *
 * 🔴 Potvrda se OTKUCAVA, kao pseudonim kod resetovanja naloga: klik ne sme da
 * promaši, a kucanje broja tera da se pregled zaista pročita.
 *
 * 🔴 Sprovođenje NE veruje otkucanom broju kao ulazu nego računa iznova i poredi —
 * između dva klika prolazi vreme i stanja se menjaju. Ako se broj razišao, radnja
 * staje i vraća nov pregled.
 *
 * Samo SUPERADMIN: radnja dira zapise svih članova odjednom.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !jeSuperadmin(session.user)) {
    return await greska("Neautorizovano.", 401);
  }

  const body = await req.json().catch(() => ({}));
  const potvrda = typeof body?.potvrda === "number" ? body.potvrda : null;

  if (potvrda === null) {
    return NextResponse.json(await uskladiZatecenePotvrde({ suviHod: true }));
  }

  const pregled = await uskladiZatecenePotvrde({ suviHod: true });
  if (pregled.poenPonisten !== potvrda) {
    return NextResponse.json(
      {
        error:
          `Stanje se promenilo otkako je pregled napravljen: sada bi se poništilo ` +
          `${pregled.poenPonisten.toLocaleString("sr-RS")} POENA, a potvrdio si ` +
          `${potvrda.toLocaleString("sr-RS")}. Radnja nije izvršena — pogledaj nov pregled.`,
        pregled,
      },
      { status: 409 },
    );
  }

  const ishod = await uskladiZatecenePotvrde({ suviHod: false, adminId: session.user.id });
  return NextResponse.json(ishod);
}
