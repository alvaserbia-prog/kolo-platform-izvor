import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeSuperadmin } from "@/lib/dozvole";
import {
  nalaziNegativnihZapisa,
  prenesiNegativanZapis,
  NegativanZapisGreska,
} from "@/lib/protokol/negativan-zapis-prestanak";

/**
 * Negativan zapis prestalog naloga (Pravilnik čl. 33 st. 7, čl. 17 st. 2 t. 12;
 * Registar br. 29; set 5.1.2). Samo superadmin.
 *
 * GET  — nalazi: sačuvan red ↔ nalog otvoren posle prestanka, sa istim brojem ili
 *        imenom (samo pseudonimi, mesto novog naloga, iznos, osnov — bez imena i broja).
 * POST — utvrđenje istog lica i prenos. Telo: { redId, noviId, obrazlozenje }.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  return NextResponse.json({ nalazi: await nalaziNegativnihZapisa() });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const body = await req.json().catch(() => ({}));
  try {
    const r = await prenesiNegativanZapis(session.user.id, {
      redId: typeof body.redId === "string" ? body.redId : "",
      noviId: typeof body.noviId === "string" ? body.noviId : "",
      obrazlozenje: typeof body.obrazlozenje === "string" ? body.obrazlozenje : "",
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof NegativanZapisGreska) return await greska(e.message, e.status);
    console.error("[POST /api/admin/negativni-zapisi]", e);
    return await greska("Greška.", 500);
  }
}
