import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { PotvrdaPoenStatus } from "@/generated/prisma/client";
import { POEN_VERIFIKATOR, POEN_VERIFIKOVANI } from "@/lib/protokol/dokaz-stvarnosti";

/**
 * GET /api/admin/potvrde-na-cekanju
 *
 * Spisak potvrda čiji POEN čeka trag stvarnog učešća (dokaz stvarnosti čl. 7).
 *
 * Tab postoji zbog VENTILA: ima ljudi koji doprinose a nikad neće objaviti ponudu ni
 * donirati — onaj ko samo kupuje, stariji član na programu podrške. Bez ručnog upisa
 * njima i njihovim potvrđivačima POEN ne bi stigao nikad.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !jeAdmin(session.user)) return await greska("Neautorizovano.", 401);

  const veze = await prisma.verifikacionaVeza.findMany({
    where: { poenStatus: PotvrdaPoenStatus.ZABELEZEN },
    select: {
      id: true,
      vremenskiZig: true,
      verifikator: { select: { id: true, pseudonim: true } },
      verifikovani: { select: { id: true, pseudonim: true } },
    },
    orderBy: { vremenskiZig: "asc" },
    take: 200,
  });

  return NextResponse.json({
    ukupno: veze.length,
    poenVerifikator: POEN_VERIFIKATOR,
    poenVerifikovani: POEN_VERIFIKOVANI,
    veze: veze.map((v) => ({
      id: v.id,
      vremenskiZig: v.vremenskiZig,
      potvrdjivac: v.verifikator,
      potvrdjeni: v.verifikovani,
    })),
  });
}
