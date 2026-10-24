import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cron/chat-cistenje
 * Briše chat poruke starije od 30 dana.
 * Pokreće se dnevno (preporučeno 03:00).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }

  const trideset_dana = new Date();
  trideset_dana.setDate(trideset_dana.getDate() - 30);

  const obrisano = await prisma.chatMessage.deleteMany({
    where: { createdAt: { lt: trideset_dana } },
  });

  console.log(`[Chat Cron] Obrisano poruka: ${obrisano.count}`);

  return NextResponse.json({ ok: true, obrisano: obrisano.count });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
