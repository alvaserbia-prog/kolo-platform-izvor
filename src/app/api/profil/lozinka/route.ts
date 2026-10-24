import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { staraLozinka, novaLozinka } = await req.json();
  if (!staraLozinka || !novaLozinka) {
    return await greska("Sva polja su obavezna.", 400);
  }
  if (novaLozinka.length < 8) {
    return await greska("Nova lozinka mora imati najmanje 8 znakova.", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return await greska("Korisnik nije pronađen.", 404);
  if (!user.passwordHash) return await greska("Nalog nema lozinku (OAuth nalog).", 400);

  const valid = await bcrypt.compare(staraLozinka, user.passwordHash);
  if (!valid) return await greska("Trenutna lozinka nije tačna.", 400);

  const passwordHash = await bcrypt.hash(novaLozinka, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
