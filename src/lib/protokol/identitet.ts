import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ishodUpisa, type IshodUpisa, type IzvorIdentiteta } from "@/lib/identitet-pravila";

export * from "@/lib/identitet-pravila";

/**
 * Evidencija identiteta — Pravilnik o KOLO sistemu čl. 31, Politika privatnosti
 * čl. 24, Registar radnji obrade br. 21 (set 4.7.3).
 *
 * 🔴 Jedan nalog, jedno ime: jedini ulaz za upis je `upisiIdentitet`. Upisano ime
 * se ne prepisuje drugim imenom iz kasnijeg izvora; ispravka ide prigovorom
 * („Ispravka podatka") i sprovodi je superadmin kroz `ispraviIdentitet`.
 *
 * 🔴 Ime se nikad ne upisuje u opis transakcije, obaveštenje ni audit log, i
 * nijedna korisnička ruta ga ne vraća drugom korisniku. Briše se gašenjem naloga.
 */

type Klijent = Prisma.TransactionClient | typeof prisma;

export async function upisiIdentitet(
  userId: string,
  imePrezime: string,
  izvor: IzvorIdentiteta,
  tx: Klijent = prisma,
): Promise<IshodUpisa> {
  // 🔴 Brana na jedinom ulazu (čl. 31 st. 7): maloletni nalog se ne upisuje, bez
  // obzira na to koji ga je izvor doveo. Ulazne tačke ga i same odbijaju; ovo je
  // poslednja reč, jer je pokroviteljstvo do seta 4.7.7 proveravalo samo potvrdu,
  // a potvrđeno dete ima `verified: true`.
  const nalog = await tx.user.findUnique({ where: { id: userId }, select: { maloletan: true } });
  if (!nalog || nalog.maloletan) return "MALOLETAN";
  const postojece = await tx.identitetNaloga.findUnique({ where: { userId }, select: { imePrezime: true } });
  const ishod = ishodUpisa(postojece?.imePrezime, imePrezime);
  if (ishod === "UPISANO") {
    await tx.identitetNaloga.create({ data: { userId, imePrezime, izvor } });
  }
  return ishod;
}

/** Upisano ime naloga — samo za administratorski tim, izvoz i proveru pri upisu. */
export async function imeNaloga(userId: string): Promise<string | null> {
  const r = await prisma.identitetNaloga.findUnique({ where: { userId }, select: { imePrezime: true } });
  return r?.imePrezime ?? null;
}

/** Ispravka po prigovoru „Ispravka podatka" (čl. 31 st. 3) — samo superadmin. */
export async function ispraviIdentitet(userId: string, imePrezime: string) {
  await prisma.identitetNaloga.update({ where: { userId }, data: { imePrezime } });
}

/** Gašenje naloga (čl. 33 st. 4) — zapis identiteta se briše. */
export async function obrisiIdentitet(userId: string, tx: Klijent = prisma) {
  await tx.identitetNaloga.deleteMany({ where: { userId } });
}
