import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { izvrsiNocnuEmisiju } from "@/lib/protokol/programi";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/emisija/nocna — manualni okidač (samo admin)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  try {
    const rezultat = await izvrsiNocnuEmisiju(new Date());
    await logAdminAkcija(session.user.id, "NOCNA_EMISIJA_MANUELNO");
    return NextResponse.json({ ok: true, ...rezultat });
  } catch (err) {
    console.error("[Admin] Greška pri manualnoj nocnoj emisiji:", err);
    const msg = err instanceof Error ? err.message : "Greška.";
    return await greska(msg, 500);
  }
}
