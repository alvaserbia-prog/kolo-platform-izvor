import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { DecaGreska, odluciOPrijaviRoditeljstva } from "@/lib/protokol/deca";

/**
 * POST /api/admin/deca/prijave-roditeljstva/[id]
 * Body: `{ ishod: "NEMA_OSNOVA" | "UKINUTA", obrazlozenje: string }`
 *
 * Odluka ovlašćenog lica Fondacije o prijavi lažnog roditeljstva (Pravilnik o
 * učešću dece čl. 17 st. 3–5, 18). Obrazloženje je obavezno.
 *
 * 🔴 `UKINUTA` povlači obavezno isključenje lica (čl. 18 st. 4, `iskljuciKorisnika`), pa
 * je traži SUPERADMIN — isto kao svako drugo isključenje. `NEMA_OSNOVA` donosi
 * administrator.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const ishod = body?.ishod;
  if (ishod !== "NEMA_OSNOVA" && ishod !== "UKINUTA") return await greska("Neispravna odluka.", 400);
  if (ishod === "UKINUTA" && !jeSuperadmin(session.user)) {
    return await greska("Ukidanje veze povlači isključenje — odlučuje superadmin.", 403);
  }
  const obrazlozenje = typeof body?.obrazlozenje === "string" ? body.obrazlozenje : "";

  try {
    const r = await odluciOPrijaviRoditeljstva(session.user.id, id, ishod, obrazlozenje);
    // Trag bez imena i bez podnosioca — samo prijava i ishod.
    await logAdminAkcija(session.user.id, "PRIJAVA_RODITELJSTVA_ODLUKA", undefined, `${id}: ${ishod}`).catch(
      () => {},
    );
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
