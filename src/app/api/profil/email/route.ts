import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { EmailGreska, stanjeEmaila, ukloniEmail, zatraziPotvrduEmaila } from "@/lib/protokol/dete-email";

/** GET /api/profil/email — potvrđena adresa i ona koja čeka potvrdu. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  try {
    return NextResponse.json(await stanjeEmaila(session.user.id));
  } catch (e) {
    if (e instanceof EmailGreska) return await greska(e.message, e.status);
    throw e;
  }
}

/**
 * PATCH /api/profil/email — dete upisuje svoju adresu.
 *
 * Adresa se ovde NE upisuje na nalog: šalje se link za potvrdu, a upis radi
 * `POST /api/profil/email/potvrdi`. Zašto — vidi `lib/protokol/dete-email.ts`.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  try {
    const origin = req.headers.get("origin") ?? undefined;
    return NextResponse.json(await zatraziPotvrduEmaila(session.user.id, body.email, origin));
  } catch (e) {
    if (e instanceof EmailGreska) return await greska(e.message, e.status);
    throw e;
  }
}

/** DELETE /api/profil/email — uklanjanje adrese sa naloga. */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  try {
    return NextResponse.json(await ukloniEmail(session.user.id));
  } catch (e) {
    if (e instanceof EmailGreska) return await greska(e.message, e.status);
    throw e;
  }
}
