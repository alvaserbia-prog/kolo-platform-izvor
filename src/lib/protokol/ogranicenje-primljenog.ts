import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Koliko je u zapisu ograničeno po poništenju donacije unapred (Pravilnik o pokroviteljstvu
 * i donacijama čl. 6 st. 7; Pravilnik o KOLO sistemu čl. 36 st. 6; set 5.0.9): iznos ostaje
 * u zapisu, ali se ne može prepisati, iskoristiti za učešće u projektu ni upisati u ZRNO.
 *
 * Važi samo AKTIVNO ograničenje čiji rok (7 dana) nije prošao — i bez upisa PRESTALO.
 * 🔴 Zaseban fajl bez drugih zavisnosti, jer ga uvoze svi izlazi iz zapisa (prepis,
 * zadruga, nabavka, vaučeri, ZRNO), a `donacija-unapred.ts` uvozi pola Protokola.
 * Brana `donacija-unapred-izvor.test.ts`.
 */
export async function ograniceno(
  walletId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  const r = await tx.ogranicenjePrimljenog.aggregate({
    where: { walletId, status: "AKTIVNO", rokDo: { gt: new Date() } },
    _sum: { iznos: true },
  });
  return r._sum.iznos ?? 0;
}
