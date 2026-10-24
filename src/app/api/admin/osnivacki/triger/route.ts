import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proveriIEvidentirajKorak } from "@/lib/protokol/osnivacki";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

/**
 * POST /api/admin/osnivacki/triger
 * Manuelno okidanje provere i evidentiranja koraka osnivackog doprinosa.
 * U buducnosti zameniti sa cron job-om (noćna emisija).
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeSuperadmin(session.user)) return await greska("Samo admin.", 403);

  try {
    const rezultat = await proveriIEvidentirajKorak();
    await logAdminAkcija(session.user.id, "OSNIVACKI_TRIGER_MANUELNO");
    return NextResponse.json(rezultat);
  } catch (e) {
    return await greska(String(e), 500);
  }
}
