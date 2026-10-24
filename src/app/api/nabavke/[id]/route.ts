import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/nabavke/[id]
 *
 * Kartica nabavke sa celom kalkulacijom (čl. 20) i stanjem sopstvene prijave.
 *
 * 🔴 Objavljuju se SVE ponude, i one koje nisu izabrane (čl. 15 st. 2) — bez toga
 * „najpovoljnija" nije provera nego tvrdnja.
 *
 * 🔴 Spisak preuzimalaca nosi pseudonim i mesto u redu, ali NIKAD broj POEN-a u
 * zapisu (čl. 31 st. 2). Kod za preuzimanje vidi isključivo sam korisnik.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const n = await prisma.nabavka.findUnique({
    where: { id },
    include: {
      naziv: { select: { naziv: true } },
      ponude: { orderBy: { cenaPoJedinici: "asc" } },
    },
  });
  if (!n) return await greska("Nabavka nije pronađena.", 404);

  const [moja, brojPrijava, preuzeli] = await Promise.all([
    prisma.nabavkaPrijava.findUnique({
      where: { nabavkaId_userId: { nabavkaId: id, userId: session.user.id } },
      select: {
        status: true,
        mesto: true,
        kod: true,
        danPreuzimanja: true,
        rezervisano: true,
        pozvanAt: true,
      },
    }),
    prisma.nabavkaPrijava.count({ where: { nabavkaId: id } }),
    prisma.nabavkaPrijava.findMany({
      where: { nabavkaId: id, status: "PREUZEO" },
      orderBy: { mesto: "asc" },
      select: { mesto: true, user: { select: { pseudonim: true } } },
    }),
  ]);

  const nabavna = n.nabavnaCena ? Number(n.nabavnaCena) : null;

  return NextResponse.json({
    id: n.id,
    naziv: n.naziv.naziv,
    status: n.status,
    dobavljac: n.dobavljac,
    jedinicaMere: n.jedinicaMere,
    nabavnaCena: nabavna,
    poenObrazlozenje: n.poenObrazlozenje,
    saldoSnimak: n.saldoSnimak ? Number(n.saldoSnimak) : null,
    rezervaSnimak: n.rezervaSnimak ? Number(n.rezervaSnimak) : null,
    iznosNabavke: n.iznosNabavke ? Number(n.iznosNabavke) : null,
    brojJedinica: n.brojJedinica,
    brojDelova: n.brojDelova,
    velicinaDela: n.velicinaDela,
    poenPoDelu: n.poenPoDelu,
    ukupnoPoena: n.poenPoDelu && n.brojDelova ? n.poenPoDelu * n.brojDelova : null,
    mestoPreuzimanja: n.mestoPreuzimanja,
    preuzimanjeOd: n.preuzimanjeOd?.toISOString() ?? null,
    preuzimanjeDo: n.preuzimanjeDo?.toISOString() ?? null,
    prijaveDo: n.prijaveDo?.toISOString() ?? null,
    objavljenoAt: n.objavljenoAt?.toISOString() ?? null,
    placenoRSD: n.placenoRSD ? Number(n.placenoRSD) : null,
    obustavaRazlog: n.obustavaRazlog,
    ponude: n.ponude.map((p) => ({
      ponudjac: p.ponudjac,
      cena: Number(p.cenaPoJedinici),
      izabrana: p.izabrana,
      napomena: p.napomena,
    })),
    brojPrijava,
    // Tokom otvorenih prijava vidi se samo brojka — spisak bi ljude terao da se
    // povlače gledajući tuđa imena.
    preuzeli: preuzeli.map((p) => ({ pseudonim: p.user.pseudonim, mesto: p.mesto })),
    moja: moja
      ? {
          status: moja.status,
          mesto: moja.mesto,
          kod: moja.kod,
          danPreuzimanja: moja.danPreuzimanja?.toISOString() ?? null,
          rezervisano: moja.rezervisano,
          pozvanAt: moja.pozvanAt?.toISOString() ?? null,
        }
      : null,
  });
}
