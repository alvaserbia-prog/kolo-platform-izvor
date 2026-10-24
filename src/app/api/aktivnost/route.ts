import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/aktivnost — beleži posetu stranice u dnevnik aktivnosti.
 *
 * Poziva ga `AktivnostTracker` (root layout) na svaku promenu putanje.
 * Beleži se ISKLJUČIVO za prijavljene korisnike — za goste ruta ćuti (200
 * bez upisa), da klijent ne bi prijavljivao greške u konzoli.
 *
 * Ponovljena poseta ISTE stranice unutar 5 minuta se ne upisuje ponovo
 * (štedi bazu; „kad je ko bio aktivan" ostaje tačno u granici od 5 min).
 */
const MAX_PUTANJA = 200;
const DEDUP_PROZOR_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: true });
  const userId = session.user.id;

  // Zaštita od zatrpavanja: max 60 upisa/min po korisniku.
  if (!rateLimit(`aktivnost:${userId}`, 60, 60_000).ok) {
    return NextResponse.json({ ok: true });
  }

  let putanja: unknown;
  try {
    ({ putanja } = await req.json());
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (
    typeof putanja !== "string" ||
    !putanja.startsWith("/") ||
    putanja.length > MAX_PUTANJA
  ) {
    return await greska("Neispravna putanja.", 400);
  }

  const poslednja = await prisma.aktivnostLog.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { putanja: true, createdAt: true },
  });
  if (
    poslednja &&
    poslednja.putanja === putanja &&
    Date.now() - poslednja.createdAt.getTime() < DEDUP_PROZOR_MS
  ) {
    return NextResponse.json({ ok: true });
  }

  await prisma.aktivnostLog.create({ data: { userId, putanja } });
  return NextResponse.json({ ok: true });
}
