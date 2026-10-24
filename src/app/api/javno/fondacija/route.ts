import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";
import { dohvatiSaldoFondacije, dohvatiGodisnjiProjektniPregled } from "@/lib/protokol/fondacija";

/**
 * GET /api/javno/fondacija
 * Javna transparentnost sredstava Fondacije.
 * Vraca: saldo, ukupan priliv (donacije + pokroviteljstvo), ukupan odliv (troskovi),
 *        pun spisak troskova grupisan po kategoriji i zbirni godisnji pregled
 *        projekata (Pravilnik o projektima i kolektivnim nabavkama cl. 31).
 */
export async function GET() {
  try {
    const [saldo, troskoviPoKategoriji, ukupnoTroskova, projekti] = await Promise.all([
      dohvatiSaldoFondacije(),
      prisma.fondacijaTrosak.groupBy({
        by: ["kategorija"],
        _sum: { iznosRSD: true },
        _count: true,
      }),
      prisma.fondacijaTrosak.count(),
      dohvatiGodisnjiProjektniPregled(),
    ]);

    return NextResponse.json({
      saldo,
      troskoviPoKategoriji: troskoviPoKategoriji.map((t) => ({
        kategorija: t.kategorija,
        ukupnoRSD: Number(t._sum.iznosRSD ?? 0),
        brojTroskova: t._count,
      })),
      ukupnoZapisaTroskova: ukupnoTroskova,
      projekti,
    });
  } catch (e) {
    return await greska(String(e), 500);
  }
}
