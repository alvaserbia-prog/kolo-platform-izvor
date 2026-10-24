import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, klijentIP } from "@/lib/rate-limit";

/**
 * POST /api/pijaca/[id]/pregled — uveća brojač pregleda oglasa.
 *
 * Zove ga `OglasDetalj` pri otvaranju stranice oglasa. Otvoreno i za goste
 * (pregled oglasa je javan, Pravilnik čl. 16).
 *
 * Šta se NE broji:
 *  - pregled samog oglašivača (inače bi sebi napunio brojač),
 *  - ponovljeno otvaranje istog oglasa iz istog pretraživača u toku dana
 *    (guard je u klijentu, `localStorage`),
 *  - više od 10 poziva u minuti sa iste adrese za isti oglas (ovde).
 *
 * Uvek vraća `{ ok: true }` — brojač je sporedan podatak i ne sme da pravi
 * greške u konzoli posetiocu.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const kljuc = session?.user?.id ?? klijentIP(req);
  if (!rateLimit(`pregled:${id}:${kljuc}`, 10, 60_000).ok) {
    return NextResponse.json({ ok: true });
  }

  const oglas = await prisma.marketplaceListing.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!oglas || oglas.sellerId === session?.user?.id) {
    return NextResponse.json({ ok: true });
  }

  await prisma.marketplaceListing.update({
    where: { id },
    data: { pregledi: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
