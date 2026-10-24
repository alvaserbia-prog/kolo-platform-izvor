import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";

/**
 * GET /api/admin/prigovori — lista svih prigovora
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nije ovlašćen.", 403);
  }

  const prigovori = await prisma.prigovorNaOdluku.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { pseudonim: true } },
    },
  });

  return NextResponse.json(prigovori);
}
