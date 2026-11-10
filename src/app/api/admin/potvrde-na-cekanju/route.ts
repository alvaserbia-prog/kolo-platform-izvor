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
 * Spisak potvrda čiji POEN čeka trag stvarnog učešća (dokaz stvarnosti čl. 19 st. 2).
 *
 * Samo pregled. 🔴 Ručni upis po oceni Fondacije (bivši čl. 19 st. 7) ukinut je setom
 * 5.1.2 — ruta `[id]/upisi` ne postoji i ne vraća se.
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
