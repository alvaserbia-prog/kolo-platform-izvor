import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeSuperadmin } from "@/lib/dozvole";
import { zapisiOtvaranja } from "@/lib/protokol/zahtev-razgovor";

/**
 * GET — ko je otvorio ime i broj korisnika sa spiska za poziv (dokaz stvarnosti čl.
 * 4a st. 5; Uslovi čl. 16b st. 3; radnja obrade br. 24). Samo superadmin.
 * Zapis nosi pseudonim člana Kola, pseudonim pozvanog i vreme — bez imena i broja.
 * Filter `?pseudonim=` traži po bilo kojoj od dve strane.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const pseudonim = req.nextUrl.searchParams.get("pseudonim") ?? undefined;
  return NextResponse.json({ zapisi: await zapisiOtvaranja({ pseudonim }) });
}
