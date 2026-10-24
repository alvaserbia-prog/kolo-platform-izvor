/**
 * PATCH /api/profil/obavestenja
 *
 * Uključi/isključi email obaveštenja za prijavljenog korisnika.
 * Body: { emailObavestenja: boolean }
 *
 * Ne utiče na sistemske mejlove (reset lozinke) — oni idu uvek.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  let body: { emailObavestenja?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Nevažeći JSON.", 400);
  }

  if (typeof body.emailObavestenja !== "boolean") {
    return await greska("Nedostaje emailObavestenja.", 400);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailObavestenja: body.emailObavestenja },
  });

  return NextResponse.json({ ok: true, emailObavestenja: body.emailObavestenja });
}
