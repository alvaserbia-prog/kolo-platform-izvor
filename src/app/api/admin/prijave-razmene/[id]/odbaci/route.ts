import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { odbaciPrijavu } from "@/lib/protokol/prijava-razmene";

/**
 * POST /api/admin/prijave-razmene/[id]/odbaci  { odluka }
 *
 * Prepis ostaje kakav jeste. Obrazloženje je obavezno i ide prijaviocu — odluka
 * bez razloga je za čoveka isto što i ćutanje.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const odluka = typeof body.odluka === "string" ? body.odluka.trim() : "";
  if (odluka.length < 10) return await greska("Obrazloženje je obavezno — šalje se prijaviocu.", 400);

  const rez = await odbaciPrijavu(id, session.user.id, odluka);
  if (!rez.ok) return await greska(rez.razlog, 400);
  return NextResponse.json({ ok: true });
}
