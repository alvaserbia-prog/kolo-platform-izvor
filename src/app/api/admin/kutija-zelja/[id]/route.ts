import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { KutijaGreska, odluciOZelji, type RadnjaFondacije } from "@/lib/protokol/kutija-zelja";

const RADNJE: RadnjaFondacije[] = ["PRIKAZI", "ODBIJ", "ODGOVORI"];

/**
 * POST /api/admin/kutija-zelja/[id]
 * Body: `{ radnja: "PRIKAZI" | "ODBIJ" | "ODGOVORI", tekst?: string }`
 *
 * Odluka Fondacije o predlogu deteta: prikaz posle pregleda, odbijanje uz razlog
 * koji se detetu prikazuje, ili obrazložen odgovor na prikazan predlog. Predlog se
 * ne prepravlja.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const radnja = body?.radnja as RadnjaFondacije;
  if (!RADNJE.includes(radnja)) return await greska("Neispravna odluka.", 400);

  try {
    const r = await odluciOZelji(session.user.id, id, radnja, body?.tekst);
    // Trag bez teksta predloga i bez autora — samo predlog i radnja.
    await logAdminAkcija(session.user.id, "KUTIJA_ZELJA_ODLUKA", undefined, `${id}: ${radnja}`).catch(() => {});
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof KutijaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
