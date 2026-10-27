import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROTOKOL_WALLET_ID } from "@/lib/protokol/zrno";
import { krajRokaVaucera, ROK_NABAVKA_DANA, ROK_RAZMENA_DANA, ROK_VAUCER_POSLE_ISTEKA_DANA, rokOd } from "@/lib/prigovor-pravila";

/**
 * GET /api/prigovor/predmeti
 *
 * Šta korisnik sme da izabere kao PREDMET prigovora (Uslovi čl. 40 st. 2–3), i
 * koja izjašnjenja se od njega traže (Uslovi čl. 40 st. 5).
 *
 * Spisak je već filtriran rokom, pa čovek ne bira nešto što će ruta odbiti —
 * ruta ipak proverava sve ponovo, jer ekran nije poslednja reč.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const ja = session.user.id;
  const sada = new Date();
  const odRazmene = rokOd(sada, -ROK_RAZMENA_DANA);
  const odNabavke = rokOd(sada, -ROK_NABAVKA_DANA);

  const odIstekaVaucera = rokOd(sada, -ROK_VAUCER_POSLE_ISTEKA_DANA);

  const [poslati, ponisteni, delovi, izjasnjenja, vauceri] = await Promise.all([
    // Prepisi koje sam ja učinio i koji još nisu prijavljeni.
    prisma.transaction.findMany({
      where: {
        type: "TRANSFER",
        createdAt: { gte: odRazmene },
        fromWallet: { userId: ja },
        // Sirov `TRANSFER` nosi i vraćanja Protokolu (poništenje potvrde pri
        // brisanju člana, prestanak statusa). To nije razmena i nema drugu stranu.
        toWalletId: { not: PROTOKOL_WALLET_ID },
        prijavaRazmene: null,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, amount: true, createdAt: true,
        toWallet: { select: { user: { select: { pseudonim: true } } } },
      },
    }),
    // Prepisi koji su MENI poništeni — prigovor na odluku Fondacije.
    prisma.transaction.findMany({
      where: {
        type: "TRANSFER",
        toWallet: { userId: ja },
        prijavaRazmene: { status: "PONISTENA", resenAt: { gte: odRazmene } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, amount: true, createdAt: true,
        fromWallet: { select: { user: { select: { pseudonim: true } } } },
      },
    }),
    prisma.nabavkaPrijava.findMany({
      where: {
        userId: ja,
        status: "PREUZEO",
        ispravljenoAt: null,
        preuzetoAt: { gte: odNabavke },
      },
      orderBy: { preuzetoAt: "desc" },
      select: {
        id: true, preuzetoAt: true,
        nabavka: { select: { naziv: { select: { naziv: true } } } },
      },
    }),
    prisma.prijavaRazmene.findMany({
      where: { protivId: ja, status: "OTVORENA", odgovorProtivAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, opis: true, izjasnjenjeDo: true,
        prijavioc: { select: { pseudonim: true } },
        transakcija: { select: { amount: true, createdAt: true } },
      },
    }),
    // Vaučeri na koje se može podneti prigovor zbog neizvršenja (Uslovi čl. 40 st. 4 t. 4):
    // dodeljeni, iskorišćeni ili istekli — 30 dana od označavanja kao iskorišćen, a
    // najkasnije 15 dana od isteka roka važenja (dodatno se filtrira `krajRokaVaucera`).
    prisma.vaucer.findMany({
      where: {
        imalacId: ja,
        status: { in: ["DODELJEN", "ISKORISCEN", "ISTEKAO"] },
        ugovor: { vaziDo: { gte: odIstekaVaucera } },
      },
      orderBy: { dodeljenAt: "desc" },
      take: 50,
      select: { id: true, status: true, iskoriscenAt: true, ugovor: { select: { opis: true, naziv: true, vaziDo: true } } },
    }),
  ]);

  return NextResponse.json({
    razmena: [
      ...poslati.map((t) => ({
        id: t.id,
        iznos: t.amount,
        datum: t.createdAt,
        strana: t.toWallet?.user?.pseudonim ?? "?",
        smer: "poslao" as const,
      })),
      ...ponisteni.map((t) => ({
        id: t.id,
        iznos: t.amount,
        datum: t.createdAt,
        strana: t.fromWallet?.user?.pseudonim ?? "?",
        smer: "ponisten" as const,
      })),
    ],
    nabavka: delovi.map((d) => ({
      id: d.id,
      dobro: d.nabavka.naziv.naziv,
      datum: d.preuzetoAt,
    })),
    vaucer: vauceri
      .filter(
        (v) =>
          !v.ugovor.vaziDo ||
          krajRokaVaucera({
            vaziDo: v.ugovor.vaziDo,
            iskoriscenAt: v.status === "ISKORISCEN" ? v.iskoriscenAt : null,
          }).getTime() >= sada.getTime(),
      )
      .map((v) => ({
        id: v.id,
        opis: v.ugovor.opis,
        davalac: v.ugovor.naziv,
        vaziDo: v.ugovor.vaziDo,
      })),
    izjasnjenja: izjasnjenja.map((p) => ({
      id: p.id,
      pseudonim: p.prijavioc.pseudonim,
      opis: p.opis,
      iznos: p.transakcija.amount,
      datum: p.transakcija.createdAt,
      rokDo: p.izjasnjenjeDo,
    })),
  });
}
