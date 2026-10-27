/**
 * „Otvori ime i broj" — poziv korisnika sa spiska za poziv (dokaz stvarnosti čl. 10
 * st. 2–4; set 4.8.2). Putanja ostaje (CLAUDE.md pravilo 12).
 *
 * POST   — član Kola otvara poziv: dobija ime i prezime (kad je upisano) i broj
 *          telefona, a poziv se zaključava za ostale na `BROJ_OTVOREN_MINUTA`
 *          (jedan član Kola drži najviše jedan otvoren poziv). Fondacija beleži ko
 *          je podatke otvorio (`ZapisOtvaranjaPoziva`, u istoj transakciji).
 *          Pre prvog otvaranja telo nosi `{ poverljivost: true }` — izjavu o
 *          poverljivosti (čl. 10 st. 3; S2-M1); bez nje odgovor je 428.
 * DELETE — zatvara poziv pre isteka. Zapis otvaranja ostaje.
 *
 * 🔴 Ime i broj ne idu u audit log ni obaveštenje — samo u ovaj odgovor.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { otvoriPoziv, zatvoriPoziv, ZahtevGreska } from "@/lib/protokol/zahtev-razgovor";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await otvoriPoziv(session.user.id, id, body?.poverljivost === true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof ZahtevGreska) return await greska(e.message, e.status);
    console.error("[POST /api/zahtev-razgovor/[id]/broj]", e);
    return await greska("Greška.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  await zatvoriPoziv(session.user.id, id);
  return NextResponse.json({ ok: true });
}
