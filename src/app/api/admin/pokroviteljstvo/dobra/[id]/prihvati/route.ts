import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { prihvatiPrijavu, odgovorNaGresku } from "@/lib/protokol/pokroviteljstvo-dobrima";

// POST /api/admin/pokroviteljstvo/dobra/[id]/prihvati — Fondacija je proverila da je
// fotografija cenovnika priložena (donacije čl. 29 st. 2); cenu ne upoređuje.
// Podatke o davaocu je uporedila sa registrom pri odobrenju upisa (čl. 18 st. 1).
// Generiše se ugovor.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  try {
    // Set 5.0.5 — prihvatanjem Fondacija utvrđuje poreklo hrane (donacije čl. 22 st. 5) i potpisuje
    // ugovor koji je podnosilac već potpisao: ugovor je zaključen, vaučeri izdati, POEN evidentiran.
    const ishod = await prihvatiPrijavu(id, session.user.id, req.headers.get("origin") ?? undefined);
    return NextResponse.json({ ok: true, ishod });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
