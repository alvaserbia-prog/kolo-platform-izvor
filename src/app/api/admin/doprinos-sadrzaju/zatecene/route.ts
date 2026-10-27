import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { revidirajDoprinose } from "@/lib/protokol/doprinos-sadrzaju";

/**
 * GET /api/admin/doprinos-sadrzaju/zatecene
 *
 * Revizija kanala: ko je objavio kvalifikovan oglas a nije dobio svojih 1.000 POEN.
 * ČITA, ne menja ništa — prvo se vidi šta fali, pa se tek onda pokreće ispravka.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeSuperadmin(session.user)) return await greska("Samo superadmin.", 403);
  try {
    return NextResponse.json(await revidirajDoprinose());
  } catch (e) {
    return await greska(String(e), 500);
  }
}

/**
 * POST /api/admin/doprinos-sadrzaju/zatecene — UKINUTO (410).
 *
 * Jednokratno razrešavanje doprinosa koji stoje ZABELEZEN kod verifikovanih
 * korisnika imalo je osnov u prelaznom stavu Pravilnika 4.8.5 čl. 40a. Set 5.0 tu
 * prelaznu odredbu nema, pa ova radnja više nema osnov: emisija bez osnova iz
 * Pravilnika čl. 19 nije dozvoljena. Revizija (GET) ostaje — ona samo čita.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeSuperadmin(session.user)) return await greska("Samo superadmin.", 403);
  return await greska(
    "Radnja je ukinuta: prelazna odredba o zatečenim doprinosima za prvi oglas ne postoji u setu akata 5.0.",
    410,
  );
}
