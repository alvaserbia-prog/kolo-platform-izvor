import { NextResponse } from "next/server";
import { javnaRangListaNovca } from "@/lib/protokol/pokrovitelj";
import { javnaRangListaDobara } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * GET /api/pokrovitelji — javna rang-lista pokrovitelja u dva odvojena dela
 * (Pravilnik o pokroviteljstvu i donacijama čl. 13 st. 1): `novcani` (novčani
 * doprinos) i `dobra` (vrednost pokroviteljstva dobrima i uslugama). U oba dela
 * samo naziv, logotip (čl. 13 st. 4, ako je priložen) i iznos u dinarima.
 *
 * 🔴 Broj POEN-a se ne objavljuje. 🔴 Bez PIB-a, matičnog broja, BPG-a, sedišta i
 * podnosioca prijave: pokrovitelj se identifikuje samo nazivom (čl. 13 st. 2), a
 * preduzetniku je sedište često kućna adresa.
 */
export async function GET() {
  const [novcani, dobra] = await Promise.all([javnaRangListaNovca(), javnaRangListaDobara()]);
  return NextResponse.json({ novcani, dobra });
}
