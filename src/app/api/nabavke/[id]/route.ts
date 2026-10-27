import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/nabavke/[id]
 *
 * Kartica nabavke sa kalkulacijom (nabavke čl. 18) i stanjem sopstvene prijave.
 *
 * 🔴 Dinarska strana (ponude sa iznosima i ponuđačima, izabrani dobavljač, nabavna
 * cena, sredstva, gornja granica, plaćen iznos) NE ide uz kalkulaciju (čl. 18 st. 2):
 * objavljuje se u celini u izveštaju o raspolaganju sredstvima Fondacije, odvojeno
 * (čl. 37 st. 2; `GET /api/javno/fondacija/projekti`). Uz broj POEN-a po delu bi se
 * deljenjem čitao odnos POEN-a prema dinaru (R-01). Odbijena mera: dinarski trošak
 * se ne vraća u tabelu sa brojem POEN-a po delu. Brana: `nabavka-dinarska-strana-izvor.test.ts`.
 *
 * 🔴 Spisak preuzimalaca (pseudonim i mesto u redu) dobijaju SAMO učesnici (čl. 37
 * st. 3; Pravilnik čl. 56) — korisnik koji nije u Kolu i dete dobijaju samo broj.
 * Broj POEN-a u zapisu se uz spisak nikad ne objavljuje. Kod za preuzimanje vidi
 * isključivo sam korisnik.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const n = await prisma.nabavka.findUnique({
    where: { id },
    include: { naziv: { select: { naziv: true } } },
  });
  if (!n) return await greska("Nabavka nije pronađena.", 404);

  // Učesnik = u Kolu (verifikovan), nikad dete (Pravilnik čl. 2, 56).
  const ucesnik = !!session.user.verified && session.user.maloletan !== true;

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
    ucesnik
      ? prisma.nabavkaPrijava.findMany({
          where: { nabavkaId: id, status: "PREUZEO" },
          orderBy: { mesto: "asc" },
          select: { mesto: true, user: { select: { pseudonim: true } } },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    id: n.id,
    naziv: n.naziv.naziv,
    status: n.status,
    jedinicaMere: n.jedinicaMere,
    poenObrazlozenje: n.poenObrazlozenje,
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
    obustavaRazlog: n.obustavaRazlog,
    brojPrijava,
    // Tokom otvorenih prijava vidi se samo brojka — spisak bi ljude terao da se
    // povlače gledajući tuđa imena. Spisak preuzimalaca samo učesnicima (čl. 37 st. 3).
    preuzeli: ucesnik ? preuzeli.map((p) => ({ pseudonim: p.user.pseudonim, mesto: p.mesto })) : null,
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
