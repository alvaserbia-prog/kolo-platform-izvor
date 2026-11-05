import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prihvatiPotvrduPrijave, DonacijaUnapredGreska } from "@/lib/protokol/donacija-unapred";
import { MAX_POTVRDA_BAJTOVA } from "@/lib/donacija-unapred-pravila";

export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * POST /api/pokroviteljstvo/prijava/[id]/potvrda — podnosilac šalje potvrdu o uplati
 * novčanog pokroviteljstva (donacije čl. 20 st. 2, set 5.0.9). Ništa se ne evidentira
 * unapred: prijem utvrđuje Fondacija, a doprinos se evidentira u narednom obračunskom periodu.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  let forma: FormData;
  try {
    forma = await req.formData();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  const fajl = forma.get("fajl");
  if (!(fajl instanceof File)) return await greska("Nedostaje potvrda.", 400);
  if (fajl.size > MAX_POTVRDA_BAJTOVA) return await greska("Potvrda je prevelika (najviše 5 MB).", 400);
  try {
    const ishod = await prihvatiPotvrduPrijave(session.user.id, id, { sadrzaj: Buffer.from(await fajl.arrayBuffer()), mime: fajl.type });
    return NextResponse.json(ishod);
  } catch (e) {
    if (e instanceof DonacijaUnapredGreska) return await greska(e.message, e.status);
    console.error("[potvrda pokroviteljstva] greška", e);
    return await greska("Potvrda trenutno ne može da se obradi. Pokušaj ponovo.", 500);
  }
}
