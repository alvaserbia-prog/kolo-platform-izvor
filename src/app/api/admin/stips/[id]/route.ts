import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { biltenSaCenama, sacuvajCeneBiltena, StipsGreska } from "@/lib/protokol/stips";

/**
 * GET /api/admin/stips/[id] — bilten sa unetim dominantnim cenama (kategorija × pijaca).
 * PUT /api/admin/stips/[id] — unos cena: `{ datumObjave?, kategorije: [{ kategorija, jedinica,
 *     cene: { [pijaca]: broj | "" } }] }`; prazno = pijaca nije objavila cenu.
 *
 * Set 5.1.3 (donacije čl. 29 st. 1). Samo administratorski tim.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const b = await biltenSaCenama(id);
  if (!b) return await greska("Bilten nije pronađen.", 404);
  return NextResponse.json(b);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    await sacuvajCeneBiltena(id, session.user.id, { datumObjave: body.datumObjave, kategorije: body.kategorije });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof StipsGreska) return await greska(e.message, e.status);
    console.error("[admin/stips]", e);
    return await greska("Greška.", 500);
  }
}
