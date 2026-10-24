import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pretraziNazive } from "@/lib/protokol/nabavka";

/**
 * GET /api/nabavke/nazivi?q=...
 *
 * Pretraga rečnika naziva pri unosu predloga (čl. 9 st. 2).
 *
 * Ide RUTOM, ne spiskom u paketu: rečnik raste sa svakim novim nazivom, a treba
 * samo onome ko upravo bira. Isti razlog kao pretraga škola.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const q = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({ nazivi: await pretraziNazive(q) });
}
