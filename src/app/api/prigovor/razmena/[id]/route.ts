import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { odgovoriNaPrijavuRazmene } from "@/lib/protokol/prijava-razmene";

/**
 * POST /api/prigovor/razmena/[id]  { odgovor }
 *
 * Izjašnjenje druge strane pre odluke o prigovoru na prepis (Pravilnik čl. 16
 * st. 10, set 4.5.4). Rok je sedam dana od otvaranja slučaja; dok traje, odluka
 * se ne donosi — to sprovodi `ponistiPrepis`, ne ovaj ekran.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const odgovor = typeof body.odgovor === "string" ? body.odgovor : "";

  const ishod = await odgovoriNaPrijavuRazmene(id, session.user.id, odgovor);
  if (!ishod.ok) return await greska(ishod.razlog, 400);

  return NextResponse.json({ ok: true });
}
