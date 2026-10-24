import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { potvrdiUcesce, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/nabavke/[id]/potvrdi  { dan: "2026-09-21" }
 *
 * Potvrda učešća UPISOM DANA PREUZIMANJA (čl. 23 st. 2). Tek tada se POEN
 * rezerviše — prijava je nezavezujuća, obaveza nastaje kad čovek kaže kog dana
 * dolazi. Dan mora pasti unutar objavljenog perioda preuzimanja.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const dan = typeof body.dan === "string" ? new Date(body.dan) : null;
  if (!dan || Number.isNaN(dan.getTime())) return await greska("Izaberite dan preuzimanja.", 400);

  try {
    const p = await potvrdiUcesce(session.user.id, id, dan);
    return NextResponse.json({
      ok: true,
      kod: p?.kod ?? null,
      danPreuzimanja: p?.danPreuzimanja?.toISOString() ?? null,
      rezervisano: p?.rezervisano ?? 0,
    });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
