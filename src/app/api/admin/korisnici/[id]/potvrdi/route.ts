/**
 * POST /api/admin/korisnici/[id]/potvrdi — potvrda člana bez potvrde ODLUKOM
 * FONDACIJE (Pravilnik o dokazu stvarnosti čl. 5 st. 1 t. 4; Pravilnik čl. 28 st. 3).
 *
 * Telo: { obrazlozenje: string } — obavezno (dokaz stvarnosti čl. 5 st. 1 t. 4: po sopstvenoj odluci, uz obrazloženje).
 * `[id]` je id naloga ili njegov pseudonim (ekran upisuje pseudonim).
 *
 * Samo superadmin (merila posebnom odlukom ne postoje od seta 4.9.0). Nije nova
 * verifikacija, ne nosi POEN, ne ulazi u dnevni tempo i ne podleže nadzoru; trag
 * ide u audit. Potvrđeni dobija spisak povezanih (čl. 17); automatske potvrde lanca nema.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import {
  potvrdiClanaOdlukomFondacije,
  VerifikacijaGreska,
} from "@/lib/protokol/verifikacija-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  let body: { obrazlozenje?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return await greska("Nevažeći JSON.", 400);
  }
  const obrazlozenje = typeof body.obrazlozenje === "string" ? body.obrazlozenje : "";

  const kljuc = decodeURIComponent(id).trim().replace(/^@/, "");
  const nalog = await prisma.user.findFirst({
    where: { OR: [{ id: kljuc }, { pseudonimLower: kljuc.toLowerCase() }] },
    select: { id: true },
  });
  if (!nalog) return await greska("Član nije pronađen.", 404);

  try {
    const rez = await potvrdiClanaOdlukomFondacije(session.user.id, nalog.id, obrazlozenje);
    return NextResponse.json({
      ok: true,
      pseudonim: rez.verifikovaniPseudonim,
      status: rez.status,
      povezani: rez.povezani,
    });
  } catch (e) {
    if (e instanceof VerifikacijaGreska) return await greska(e.message, e.statusCode);
    console.error("[POST /api/admin/korisnici/[id]/potvrdi]", e);
    return await greska("Greška servera", 500);
  }
}
