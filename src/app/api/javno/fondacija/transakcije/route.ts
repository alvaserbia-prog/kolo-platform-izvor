import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/javno/fondacija/transakcije
 * Jedinstven spisak transakcija sa bankovnog racuna Fondacije (transparentnost):
 *  - priliv: donacije (CONFIRMED) + pokroviteljstvo (RSD)
 *  - odliv:  troskovi Fondacije (RSD)
 * Identitet donatora je transparentan (ime i prezime donatora javne donacije /
 * naziv pokrovitelja).
 *
 * 🔴 Set 4.8.2 (donacije čl. 11 st. 1; Uslovi čl. 16 st. 5): uz javnu donaciju
 * korisnik i verifikovan učesnik vide IME I PREZIME donatora; pseudonim i veza ka
 * profilu se ne prikazuju nikome (pseudonim se vidi samo u pregledu transakcija
 * POEN-a). Anonimna donacija ostaje samo iznos i datum. Neprijavljeno lice i dete
 * vide samo iznos i datum. Iznos i datum ostaju javni svima.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const vidiIme = !!session?.user && session.user.maloletan !== true;
  const [donacije, pokroviteljstvo, troskovi] = await Promise.all([
    prisma.donationRecord.findMany({
      where: { status: "CONFIRMED" },
      select: {
        id: true,
        amountRSD: true,
        confirmedAt: true,
        createdAt: true,
        javno: true,
        donatorIme: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.pokroviteljDoprinos.findMany({
      select: {
        id: true,
        rsdIznos: true,
        napomena: true,
        createdAt: true,
        pokrovitelj: { select: { naziv: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.fondacijaTrosak.findMany({
      select: { id: true, iznosRSD: true, kategorija: true, opis: true, datum: true },
      orderBy: { datum: "desc" },
      take: 200,
    }),
  ]);

  const stavke = [
    ...donacije.map((d) => ({
      id: `don-${d.id}`,
      datum: (d.confirmedAt ?? d.createdAt).toISOString(),
      smer: "PRILIV" as const,
      kategorija: "Donacija",
      opis: (d.javno && vidiIme && d.donatorIme) || "Donacija",
      userId: null,
      iznosRSD: Number(d.amountRSD),
    })),
    ...pokroviteljstvo.map((p) => ({
      id: `pok-${p.id}`,
      datum: p.createdAt.toISOString(),
      smer: "PRILIV" as const,
      kategorija: "Pokroviteljstvo",
      opis: p.pokrovitelj?.naziv ?? p.napomena ?? "Pokroviteljstvo",
      userId: null,
      iznosRSD: Number(p.rsdIznos),
    })),
    ...troskovi.map((tr) => ({
      id: `tro-${tr.id}`,
      datum: tr.datum.toISOString(),
      smer: "ODLIV" as const,
      kategorija: String(tr.kategorija),
      opis: tr.opis,
      userId: null,
      iznosRSD: Number(tr.iznosRSD),
    })),
  ].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

  return NextResponse.json({ stavke });
}
