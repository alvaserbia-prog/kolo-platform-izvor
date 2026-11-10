import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import { prihvatiPrijavu, odgovorNaGresku, procitajStipsKategoriju } from "@/lib/protokol/pokroviteljstvo-dobrima";
import { cenaStipsZa } from "@/lib/protokol/stips";

// POST /api/admin/pokroviteljstvo/dobra/[id]/prihvati — Fondacija je proverila da je
// fotografija cenovnika priložena (donacije čl. 29 st. 2); cenu ne upoređuje.
// Podatke o davaocu je uporedila sa registrom pri odobrenju upisa (čl. 18 st. 1).
// Generiše se ugovor.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  // Set 5.1.3 (donacije čl. 29 st. 1): uz prihvatanje superadmin bira samo KATEGORIJU iz STIPS
  // biltena; cenu (prosek dominantnih cena pijaca iz poslednjeg biltena), bilten i cene pijaca
  // povlači sistem. 🔴 Proizvoljna cena mimo biltena se ne unosi. Vrednost se tada računa po toj
  // ceni i ugovor čeka ponovni potpis.
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const izbor = procitajStipsKategoriju(body);
  if (!izbor.ok) return await greska(izbor.razlog, 400);
  if (izbor.kategorija && !jeSuperadmin(session.user)) return await greska("STIPS cenu primenjuje samo superadmin.", 403);
  const stips = izbor.kategorija ? await cenaStipsZa(izbor.kategorija, new Date()) : null;
  if (izbor.kategorija && !stips)
    return await greska("Za ovu kategoriju nijedna pijaca nije objavila cenu u biltenu — važi cenovnik davaoca.", 409);
  try {
    // Set 5.0.5 — prihvatanjem Fondacija utvrđuje poreklo hrane (donacije čl. 22 st. 5) i potpisuje
    // ugovor koji je podnosilac već potpisao: ugovor je zaključen, vaučeri izdati, POEN evidentiran.
    const ishod = await prihvatiPrijavu(id, session.user.id, req.headers.get("origin") ?? undefined, stips);
    return NextResponse.json({ ok: true, ishod });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
