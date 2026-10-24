import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upisiPredlog, ukloniPredlog, mojPredlog, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * GET    /api/nabavke/predlog        — moj aktivan predlog (ili null)
 * PUT    /api/nabavke/predlog {naziv} — upiši ili zameni
 * DELETE /api/nabavke/predlog        — ukloni
 *
 * Jedan aktivan predlog po korisniku (Pravilnik o projektima i kolektivnim
 * nabavkama čl. 9 st. 3). Nov predlog zamenjuje raniji — jednokratnost drži baza
 * (`PredlogNabavke.userId @unique`), ne kod.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const p = await mojPredlog(session.user.id);
  return NextResponse.json({
    predlog: p ? { nazivId: p.nazivId, naziv: p.naziv.naziv, upisanAt: p.createdAt.toISOString() } : null,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const body = await req.json().catch(() => ({}));
  const naziv = typeof body.naziv === "string" ? body.naziv : "";

  try {
    const zapis = await upisiPredlog(session.user.id, naziv);
    return NextResponse.json({ ok: true, nazivId: zapis.id, naziv: zapis.naziv });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  await ukloniPredlog(session.user.id);
  return NextResponse.json({ ok: true });
}
