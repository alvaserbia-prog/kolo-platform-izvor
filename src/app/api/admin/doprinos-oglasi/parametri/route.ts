import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import {
  OperativniGreska,
  PARAMETRI_UO,
  istorijaParametra,
  upisiParametar,
  vazeciParametar,
} from "@/lib/protokol/operativni-postupak";

/**
 * Parametri koje UO utvrđuje odlukom: iznos jedinice zadružnog doprinosa
 * (operativni 5.0 čl. 23 st. 4) i prag za režim odobravanja (čl. 12 st. 1 t. 3).
 * 🔴 Bez podrazumevane vrednosti. GET — admin; POST — samo superadmin.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const out: Record<string, unknown> = {};
  for (const k of PARAMETRI_UO) {
    out[k] = {
      vazece: await vazeciParametar(k),
      istorija: (await istorijaParametra(k)).map((r) => ({ ...r, vaziOd: r.vaziOd.toISOString().slice(0, 10), createdAt: r.createdAt.toISOString() })),
    };
  }
  return NextResponse.json({ parametri: out });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Odluku UO upisuje superadmin.", 403);
  const body = await req.json().catch(() => ({}));
  try {
    await upisiParametar(session.user.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
