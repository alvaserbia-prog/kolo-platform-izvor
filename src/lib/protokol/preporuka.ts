/**
 * Preporuka člana — servis (dokaz stvarnosti čl. 20, Politika čl. 18, Registar radnja br. 23,
 * set 4.8.0). Pravila su u `@/lib/preporuka-pravila`.
 */
import { prisma } from "@/lib/prisma";
import { Prisma, UserStatus } from "@/generated/prisma/client";
import { smePreporuciti, type UcesnikPreporuke } from "@/lib/preporuka-pravila";
import { jePotvrdjen, ucitajStatus } from "./status";

export * from "@/lib/preporuka-pravila";

export class PreporukaGreska extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "PreporukaGreska";
  }
}

async function ucesnik(id: string): Promise<UcesnikPreporuke | null> {
  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, maloletan: true, status: true, deaktiviranAt: true },
  });
  if (!u) return null;
  // Status iz jezgra statusa (set 4.8.2) — preporuku daje samo član Kola, odnosno
  // osnivač (dokaz stvarnosti čl. 20 st. 1). Dete se ovde ne razrešava do stanja: dete
  // preporuku ne daje ni ne prima, pa je dovoljno da nije potvrđeno.
  const status = u.maloletan ? null : await ucitajStatus(u.id);
  return {
    id: u.id,
    maloletan: u.maloletan,
    aktivan: u.status === UserStatus.ACTIVE && u.deaktiviranAt === null,
    potvrdjen: status != null && jePotvrdjen(status),
  };
}

/**
 * Stanje preporuka na profilu `zaId` iz ugla posmatrača: broj primljenih, da li ju
 * je posmatrač dao i sme li da je da. 🔴 Spisak onih koji su preporučili se ne vraća.
 */
export async function stanjePreporuka(posmatracId: string, zaId: string, posmatracPotvrdjen: boolean) {
  const [broj, moja, od, za] = await Promise.all([
    prisma.preporuka.count({ where: { zaId } }),
    prisma.preporuka.findUnique({ where: { odId_zaId: { odId: posmatracId, zaId } }, select: { id: true } }),
    ucesnik(posmatracId),
    ucesnik(zaId),
  ]);
  // Preporuku daje samo član Kola, odnosno osnivač (dokaz stvarnosti čl. 20 st. 1, set 4.8.2):
  // profil vidi i član bez potvrde, ali preporuku ne daje. Pravilo sprovodi i
  // `smePreporuciti` (polje `potvrdjen`), a ne samo ova zastavica posmatrača.
  const smem = posmatracPotvrdjen && Boolean(od && za && smePreporuciti(od, za).ok);
  return { broj, moja: Boolean(moja), smem };
}

/** Daje preporuku. Ponovljena preporuka istog para ne pravi drugi red. */
export async function dajPreporuku(odId: string, zaId: string) {
  const [od, za] = await Promise.all([ucesnik(odId), ucesnik(zaId)]);
  if (!od || !za) throw new PreporukaGreska("Korisnik ne postoji.", 404);
  const odluka = smePreporuciti(od, za);
  if (!odluka.ok) throw new PreporukaGreska(odluka.razlog, 403);
  await prisma.preporuka.upsert({
    where: { odId_zaId: { odId, zaId } },
    create: { odId, zaId },
    update: {},
  });
}

/** Povlači preporuku (dokaz stvarnosti čl. 20 st. 2). Nepostojeća preporuka nije greška. */
export async function povuciPreporuku(odId: string, zaId: string) {
  await prisma.preporuka.deleteMany({ where: { odId, zaId } });
}

/**
 * Briše preporuke koje je korisnik dao i koje je primio — pri prestanku statusa
 * (dokaz stvarnosti čl. 20 st. 5) i pri prevođenju naloga u maloletni (dete ih ne daje i
 * ne prima). Gašenje naloga anonimizuje red korisnika umesto da ga briše, pa
 * kaskada iz šeme tu ne pomaže — zato poziv postoji izričito.
 */
export async function obrisiPreporuke(userId: string, tx: Prisma.TransactionClient = prisma) {
  await tx.preporuka.deleteMany({ where: { OR: [{ odId: userId }, { zaId: userId }] } });
}
