import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrijateljGreska, dohvatiPrijatelje, poveziPoTokenu } from "@/lib/protokol/prijateljstva";

// GET /api/deca/prijatelji — spisak i broj prijatelja.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  return NextResponse.json(await dohvatiPrijatelje(session.user.id));
}

// POST /api/deca/prijatelji — poveži se skeniranim kodom.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  let token = "";
  try {
    const body = await req.json();
    token = typeof body?.token === "string" ? body.token.trim() : "";
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (!token) return await greska("Neispravan zahtev.", 400);

  try {
    return NextResponse.json(await poveziPoTokenu(session.user.id, token));
  } catch (e) {
    if (e instanceof PrijateljGreska) return await greska(e.message, e.status);
    throw e;
  }
}
