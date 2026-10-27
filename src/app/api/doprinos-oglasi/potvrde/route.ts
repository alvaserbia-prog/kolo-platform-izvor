import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { imaUlazZaPotvrde, pregledZaPotvrdu } from "@/lib/protokol/operativni-postupak";

/**
 * GET /api/doprinos-oglasi/potvrde — sve što čeka izjašnjavanje lica koje potvrđuje
 * (operativni 5.0 čl. 12, 15, 16, 18): prijave u zadacima sa odobravanjem,
 * izvršenja celina, završne potvrde i primedbe. Ulaz imaju čuvari Kola i lice koje
 * UO ovlasti (čl. 13 st. 1) — ne admin nivo kao takav.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  if (!(await imaUlazZaPotvrde(session.user.id)))
    return await greska("Izvršenje potvrđuju čuvari Kola i lice koje Upravni odbor ovlasti.", 403);
  return NextResponse.json(await pregledZaPotvrdu());
}
