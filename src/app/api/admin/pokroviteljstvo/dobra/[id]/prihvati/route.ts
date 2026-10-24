import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { prihvatiPrijavu, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

// POST /api/admin/pokroviteljstvo/dobra/[id]/prihvati — Fondacija je proverila da je
// fotografija cenovnika priložena (donacije čl. 13f st. 2); cenu ne upoređuje.
// Podatke o davaocu je uporedila sa registrom pri odobrenju upisa (čl. 6a st. 4).
// Generiše se ugovor.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  try {
    await prihvatiPrijavu(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
