import { NextRequest, NextResponse } from "next/server";
import { POKAZATELJI, danasnjeStanje, izracunaj, nizPoDanima, nizUCsv } from "@/lib/protokol/pokazatelji";

/**
 * GET /api/javno/pokazatelji — pokazatelji sistema, javno i bez prijave.
 *
 *  - JSON (podrazumevano): ciljevi, današnje stanje (mereno sada) i ceo niz po danima;
 *  - `?format=csv`: niz po danima kao CSV, sa današnjim danom u poslednjem redu.
 *
 * 🔴 Vraća isključivo zbirne brojeve: nijedan identifikator lica, nijedan broj po licu,
 * nijedan POEN po licu i nijedan dinarski iznos. Sve što izlazi prolazi kroz
 * `SirovoStanje` iz `pokazatelji-pravila.ts`; ruta sama ne čita bazu.
 * Brana: `__tests__/pokazatelji-sistema-izvor.test.ts`.
 */
export const dynamic = "force-dynamic";

const KES = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

export async function GET(req: NextRequest) {
  const [danas, niz] = await Promise.all([danasnjeStanje(), nizPoDanima()]);

  if (req.nextUrl.searchParams.get("format") === "csv") {
    // Današnji dan još nije zatvoren: ide kao poslednji red, osim ako ga niz već nosi.
    const saDanasnjim = niz.some((d) => d.dan === danas.dan) ? niz : [...niz, { ...danas, naknadno: false }];
    return new NextResponse(nizUCsv(saDanasnjim), {
      headers: {
        ...KES,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kolo-pokazatelji-sistema.csv"',
      },
    });
  }

  return NextResponse.json(
    {
      opis: "KOLO — pokazatelji sistema. Zbirni brojevi nad punoletnim, aktivnim nalozima; procenti na jednu decimalu.",
      ciljevi: Object.fromEntries(POKAZATELJI.map((p) => [p.sifra, p.cilj])),
      danas: { dan: danas.dan, ...danas.sirovo, pokazatelji: izracunaj(danas.sirovo) },
      niz: niz.map((d) => ({ dan: d.dan, naknadno: d.naknadno, ...d.sirovo, pokazatelji: izracunaj(d.sirovo) })),
    },
    { headers: KES },
  );
}
