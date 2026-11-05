import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prihvatiPotvrdu, DonacijaUnapredGreska } from "@/lib/protokol/donacija-unapred";
import { MAX_POTVRDA_BAJTOVA } from "@/lib/donacija-unapred-pravila";

// Čitanje slike traje nekoliko sekundi (prepoznavanje teksta na našem serveru).
export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * POST /api/donacije/potvrda — donator šalje potvrdu o uplati za svoju najavljenu
 * donaciju (Pravilnik o pokroviteljstvu i donacijama čl. 6 st. 4, set 5.0.9).
 * Multipart: `donationId`, `fajl` (PDF ili slika). Potvrda se čita na našem serveru;
 * ako je donatoru prijem već utvrđen do praga, doprinos se evidentira unapred.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  let forma: FormData;
  try {
    forma = await req.formData();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  const donationId = forma.get("donationId");
  const fajl = forma.get("fajl");
  if (typeof donationId !== "string" || !(fajl instanceof File)) return await greska("Nedostaje potvrda.", 400);
  if (fajl.size > MAX_POTVRDA_BAJTOVA) return await greska("Potvrda je prevelika (najviše 5 MB).", 400);

  try {
    const sadrzaj = Buffer.from(await fajl.arrayBuffer());
    const ishod = await prihvatiPotvrdu(session.user.id, donationId, { sadrzaj, mime: fajl.type });
    return NextResponse.json(ishod);
  } catch (e) {
    if (e instanceof DonacijaUnapredGreska) return await greska(e.message, e.status);
    console.error("[potvrda] greška", e);
    return await greska("Potvrda trenutno ne može da se obradi. Pokušaj ponovo.", 500);
  }
}
