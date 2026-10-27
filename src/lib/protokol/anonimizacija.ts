/**
 * Mesečni posao: anonimizacija pseudonima 10 godina posle prestanka statusa
 * (Pravilnik čl. 55 st. 3; pravila u `anonimizacija-pravila.ts`). Poziva ga
 * `cron/gdpr-cistenje`.
 *
 * Šta radi, po nalogu kome je rok istekao, u jednoj transakciji:
 *   — pseudonim zamenjuje slučajnom oznakom (`anonimno-…`), kroz `poljaPseudonima`;
 *   — briše ranije pseudonime (`PseudonimIstorija`) — i oni upućuju na nalog;
 *   — upisuje `pseudonimAnonimizovanAt`, pa se nalog više ne obrađuje.
 *
 * Šta NE radi: ne dira nijedan zapis POEN-a ni ZRNA, stanje ni opticaj —
 * numerička istorija trajno ostaje (čl. 55 st. 2–3). Ne briše `User` red ni
 * interni id: novčanik i zapisi se na njega oslanjaju.
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { poljaPseudonima } from "@/lib/pseudonim";
import { granicaAnonimizacije, oznakaAnonimnog } from "@/lib/anonimizacija-pravila";

/** Najviše naloga po prolazu — ostatak ide u naredni mesečni prolaz. */
const NAJVISE_PO_PROLAZU = 500;

export async function anonimizujPseudonime(sada: Date = new Date()): Promise<{ anonimizovano: number }> {
  const granica = granicaAnonimizacije(sada);
  const nalozi = await prisma.user.findMany({
    where: {
      pseudonimAnonimizovanAt: null,
      OR: [
        { deaktiviranAt: { lte: granica } },
        { deaktiviranAt: null, status: "EXCLUDED", suspendedAt: { lte: granica } },
      ],
    },
    select: { id: true },
    take: NAJVISE_PO_PROLAZU,
  });

  let anonimizovano = 0;
  for (const n of nalozi) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.pseudonimIstorija.deleteMany({ where: { userId: n.id } });
        await tx.user.update({
          where: { id: n.id },
          data: {
            ...poljaPseudonima(oznakaAnonimnog(randomBytes(8).toString("hex"))),
            pseudonimAnonimizovanAt: sada,
          },
        });
      });
      anonimizovano++;
    } catch (e) {
      // Sudar slučajne oznake (praktično nemoguć) ili trka — nalog ostaje za naredni prolaz.
      console.error("[anonimizacija] nalog nije anonimizovan", n.id, e);
    }
  }
  return { anonimizovano };
}
