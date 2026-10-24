import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { ResetGreska, resetujNalogNaPrviDan } from "@/lib/reset-korisnika";

/**
 * POST /api/admin/korisnici/[id]/reset
 * Body: { pseudonim: string } — mora se poklopiti sa pseudonimom naloga.
 *
 * Vraća zatečen nalog na stanje sa dana registracije, radi probe kako platforma
 * izgleda novom čoveku (bez otvaranja novog naloga). Vidi `src/lib/reset-korisnika.ts`.
 *
 * 🔴 Nepovratno i pogađa i druge naloge (padaju verifikacije koje ovaj nalog
 * dodiruje, brišu se zajednički razgovori). Zato:
 *  - samo SUPERADMIN,
 *  - pseudonim se otkuca u telu zahteva i mora da se poklopi — klik ne može da
 *    promaši red u spisku korisnika,
 *  - nalog sa admin ovlašćenjem, osnivač i vlasnik pokrovitelja se odbijaju
 *    (provere su u biblioteci).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  if (id === session.user.id) return await greska("Sopstveni nalog se ne resetuje.", 400);

  let potvrda: unknown;
  try {
    potvrda = (await req.json())?.pseudonim;
  } catch {
    return await greska("Nedostaje potvrda pseudonima.", 400);
  }
  if (typeof potvrda !== "string" || !potvrda.trim()) {
    return await greska("Nedostaje potvrda pseudonima.", 400);
  }

  const meta = await prisma.user.findUnique({ where: { id }, select: { pseudonim: true } });
  if (!meta) return await greska("Korisnik nije pronađen.", 404);
  if (potvrda.trim().toLowerCase() !== meta.pseudonim.toLowerCase()) {
    return await greska("Otkucani pseudonim se ne poklapa sa nalogom.", 400);
  }

  try {
    const rez = await resetujNalogNaPrviDan(id);
    await logAdminAkcija(
      session.user.id,
      "NALOG_RESETOVAN_NA_PRVI_DAN",
      id,
      `${rez.pseudonim}: ${rez.poenVracenProtokolu} POEN vraćeno Protokolu, ` +
        `${rez.poenVracenOdDrugih} POEN skinuto drugima, ${rez.ponistenoVerifikacija} verifikacija palo, ` +
        `${rez.zrnaOtpisana} ZRNA otpisano, ${rez.obrisanoOglasa} oglasa i ${rez.obrisanoZapisa} zapisa obrisano`,
    );
    return NextResponse.json({ ok: true, ...rez });
  } catch (e) {
    if (e instanceof ResetGreska) return await greska(e.message, e.status);
    throw e;
  }
}
