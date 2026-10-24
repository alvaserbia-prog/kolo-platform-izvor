import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validanPseudonim, PSEUDONIM_PRAVILO } from "@/lib/validacija";
import { porukaZauzeca, promeniPseudonim, proveriZauzece } from "@/lib/pseudonim";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const body = await req.json();
  if (!validanPseudonim(body?.pseudonim)) {
    return await greska(PSEUDONIM_PRAVILO, 400);
  }
  const pseudonim = (body.pseudonim as string).trim();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return await greska("Korisnik nije pronađen.", 404);

  // Provera 30-dnevnog ograničenja
  if (user.pseudonimChangedAt) {
    const elapsed = Date.now() - user.pseudonimChangedAt.getTime();
    if (elapsed < 30 * 24 * 60 * 60 * 1000) {
      return await greska("Pseudonim možete menjati jednom u 30 dana.", 400);
    }
  }

  // Zauzeto = aktivan nalog ILI ime koje je neko drugi ranije napustio (stari
  // linkovi i dalje vode na njega, pa se ne sme preuzeti).
  const zauzece = await proveriZauzece(pseudonim, user.id);
  if (zauzece) {
    return await greska(porukaZauzeca(zauzece), 409);
  }

  await prisma.$transaction(async (tx) => {
    await promeniPseudonim(tx, user.id, user.pseudonim, pseudonim, {
      pseudonimChangedAt: new Date(),
    });
  });

  return NextResponse.json({ ok: true });
}
