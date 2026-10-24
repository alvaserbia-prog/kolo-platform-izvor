/**
 * GET /api/admin/nadzor/predmeti — nadzorni predmeti (dokaz stvarnosti čl. 11a).
 *
 * Predmet nastaje kad nadzornik evidentira ishod „za proveru" ili „sporno". Predmet
 * se odnosi na verifikaciju, potvrdu člana bez potvrde ili potvrdu postojanja deteta
 * (čl. 10 st. 1 i 5, set 4.8.2) — polje `vrstaPredmeta`.
 * Vidi ga SAMO superadmin (UO Fondacije) — ne ostali nadzornici, ne verifikator,
 * ne verifikovani, ne javnost (čl. 11a st. 2).
 *
 * Panel je alat, ne organ: sam predmet ne proizvodi dejstvo prema korisniku.
 * Lažnu verifikaciju utvrđuje UO (čl. 18).
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { statusUcesnika } from "@/lib/status-ucesnika-pravila";
import type { NadzorniPredmetStatus } from "@/generated/prisma/client";

const PRIKAZI: Record<string, NadzorniPredmetStatus[]> = {
  otvoreni: ["OTVOREN"],
  reseni: ["UTVRDJENA_LAZNA", "NEMA_OSNOVA"],
};

const OSOBA = {
  id: true,
  pseudonim: true,
  createdAt: true,
  utvrdjenNepostojeci: true,
  maloletan: true,
  jeOsnivac: true,
  verified: true,
  indeksStvarnosti: true,
  potvrdjenAt: true,
  tipKorisnika: true,
} as const;

type SirovaOsoba = {
  id: string;
  pseudonim: string;
  createdAt: Date;
  utvrdjenNepostojeci: Date | null;
  maloletan: boolean;
  jeOsnivac: boolean;
  verified: boolean;
  indeksStvarnosti: number;
  potvrdjenAt: Date | null;
  tipKorisnika: string;
};

/** Osoba za ekran: pseudonim i status (indeks se ne prikazuje, set 4.8.0). */
function osoba(u: SirovaOsoba | null | undefined) {
  if (!u) return null;
  return {
    id: u.id,
    pseudonim: u.pseudonim,
    // Ovde su samo punoletni učesnici (dete se predmetom ne prikazuje).
    status: statusUcesnika(u),
    createdAt: u.createdAt.toISOString(),
    utvrdjenNepostojeci: u.utvrdjenNepostojeci?.toISOString() ?? null,
  };
}

const ZAPISI = {
  orderBy: { createdAt: "asc" as const },
  include: { nadzornik: { select: { pseudonim: true } } },
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const prikaz = req.nextUrl.searchParams.get("prikaz") ?? "otvoreni";
  const statusi = PRIKAZI[prikaz] ?? PRIKAZI.otvoreni;

  const predmeti = await prisma.nadzorniPredmet.findMany({
    where: { status: { in: statusi } },
    orderBy: { otvorenAt: "desc" },
    take: 200,
    include: {
      resenBy: { select: { pseudonim: true } },
      verifikacija: {
        include: {
          verifikator: { select: OSOBA },
          verifikovani: { select: OSOBA },
          nadzorZapisi: ZAPISI,
        },
      },
      potvrdaClana: {
        include: {
          potvrdio: { select: OSOBA },
          potvrdjeni: { select: OSOBA },
          verifikacija: { select: { verifikator: { select: { pseudonim: true } } } },
          nadzorZapisi: ZAPISI,
        },
      },
      potvrdaPostojanja: {
        include: {
          potvrdio: { select: OSOBA },
          roditelj: { select: OSOBA },
          nadzorZapisi: ZAPISI,
        },
      },
    },
  });

  const otvorenih = await prisma.nadzorniPredmet.count({ where: { status: "OTVOREN" } });

  const zapisi = (lista: { id: string; ishod: string; razlog: string | null; subjekt: string | null; opis: string | null; nadzornik: { pseudonim: string }; createdAt: Date }[]) =>
    lista.map((z) => ({
      id: z.id,
      ishod: z.ishod,
      razlog: z.razlog,
      subjekt: z.subjekt,
      opis: z.opis,
      nadzornik: z.nadzornik.pseudonim,
      createdAt: z.createdAt.toISOString(),
    }));

  return NextResponse.json({
    otvorenih,
    predmeti: predmeti.flatMap((p): Record<string, unknown>[] => {
      const osnova = {
        id: p.id,
        status: p.status,
        subjekt: p.subjekt,
        razlog: p.razlog,
        opis: p.opis,
        otvorenAt: p.otvorenAt.toISOString(),
        resenAt: p.resenAt?.toISOString() ?? null,
        resenBy: p.resenBy?.pseudonim ?? null,
        beleska: p.beleska,
      };
      if (p.verifikacija) {
        const v = p.verifikacija;
        return [{
          ...osnova,
          vrstaPredmeta: "VERIFIKACIJA" as const,
          predmetId: v.id,
          vrstaVerifikacije: v.vrsta,
          poPozivu: v.poPozivu,
          izvor: null,
          korak: null,
          uveo: null,
          verifikator: osoba(v.verifikator),
          verifikovani: osoba(v.verifikovani)!,
          vremenskiZig: v.vremenskiZig.toISOString(),
          zapisi: zapisi(v.nadzorZapisi),
        }];
      }
      if (p.potvrdaClana) {
        const c = p.potvrdaClana;
        return [{
          ...osnova,
          vrstaPredmeta: "POTVRDA_CLANA" as const,
          predmetId: c.id,
          vrstaVerifikacije: null,
          poPozivu: false,
          izvor: c.izvor,
          korak: c.korak,
          uveo: c.verifikacija.verifikator.pseudonim,
          verifikator: osoba(c.potvrdio),
          verifikovani: osoba(c.potvrdjeni)!,
          vremenskiZig: c.createdAt.toISOString(),
          zapisi: zapisi(c.nadzorZapisi),
        }];
      }
      if (p.potvrdaPostojanja) {
        const d = p.potvrdaPostojanja;
        return [{
          ...osnova,
          vrstaPredmeta: "POTVRDA_POSTOJANJA" as const,
          predmetId: d.id,
          vrstaVerifikacije: null,
          poPozivu: false,
          izvor: null,
          korak: null,
          uveo: null,
          // Samo roditelj — dete se u predmetu ne prikazuje (deca čl. 6 st. 3).
          verifikator: osoba(d.potvrdio),
          verifikovani: osoba(d.roditelj)!,
          vremenskiZig: (d.potvrdjenoAt ?? d.createdAt).toISOString(),
          zapisi: zapisi(d.nadzorZapisi),
        }];
      }
      return [];
    }),
  });
}
