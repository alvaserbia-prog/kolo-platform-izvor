import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { listaBiltena, kategorijeStips, pronadjiNoveBiltene } from "@/lib/protokol/stips";

/**
 * GET  /api/admin/stips — STIPS bilteni (najnoviji prvi) i kategorije sa unetim cenama.
 * POST /api/admin/stips — `{ akcija: "pronadji" }`: odmah traži nove biltene (isto što i cron).
 *
 * Set 5.1.3 (donacije čl. 29 st. 1). Samo administratorski tim.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const [bilteni, kategorije] = await Promise.all([listaBiltena(), kategorijeStips()]);
  return NextResponse.json({ bilteni, kategorije });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.akcija !== "pronadji") return await greska("Neispravan zahtev.", 400);
  return NextResponse.json({ ok: true, ...(await pronadjiNoveBiltene(new Date())) });
}
