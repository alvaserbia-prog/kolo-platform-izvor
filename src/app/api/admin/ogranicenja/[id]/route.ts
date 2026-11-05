import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { odluciOgranicenje, DonacijaUnapredGreska } from "@/lib/protokol/donacija-unapred";

/**
 * POST /api/admin/ogranicenja/[id] — odluka Fondacije o primaocu (donacije čl. 6 st. 8).
 * Samo superadmin: utvrđuje se da li je primalac znao da je potvrda lažna ili tuđa, a
 * posledica je otpis celog primljenog iznosa i u minus. `znao: false` — ograničenje prestaje.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Odluku o ograničenju donosi samo superadmin.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await odluciOgranicenje(session.user.id, id, body.znao === true, typeof body.obrazlozenje === "string" ? body.obrazlozenje : "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DonacijaUnapredGreska) return await greska(e.message, e.status);
    throw e;
  }
}
