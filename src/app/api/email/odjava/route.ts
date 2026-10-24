/**
 * POST /api/email/odjava
 *
 * Odjava sa email obaveštenja BEZ prijave — preko trajnog tokena iz podnožja
 * mejla (`User.emailOdjavaToken`). Namerno POST, ne GET: klijenti za poštu
 * ponekad unapred otvaraju linkove iz poruke, pa bi GET mogao da odjavi
 * korisnika koji nije ni kliknuo. Stranica `/odjava-obavestenja/[token]`
 * prikazuje dugme koje šalje ovaj zahtev.
 *
 * Body: { token: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Nevažeći JSON.", 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!token) return await greska("Nedostaje token.", 400);

  const user = await prisma.user.findUnique({
    where: { emailOdjavaToken: token },
    select: { id: true },
  });
  // Ne otkrivamo da li token postoji — odgovor je isti u oba slučaja.
  if (!user) return NextResponse.json({ ok: true });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailObavestenja: false },
  });

  return NextResponse.json({ ok: true });
}
