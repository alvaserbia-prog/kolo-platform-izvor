import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { brojOglasaUzPrijavu, MIN_OGLASA_UZ_PRIJAVU, trebaIzvod, pristupanjeSmeOdobriti } from "@/lib/protokol/gazdinstvo";
import { IZBOR_STATUSA, statusUcesnika } from "@/lib/protokol/status";

/**
 * GET /api/admin/gazdinstva — red za pregled (prijave i kasnija pristupanja) i
 * odobrena gazdinstva. BPG, izjava o tačnosti, ime i prezime članova (evidencija
 * identiteta, Registar radnji obrade br. 20 i 21) i broj telefona nosioca za
 * razgovor (čl. 6a) izlaze SAMO ovde — nijedna korisnička ruta ih ne vraća drugim
 * korisnicima. Izvod iz Registra se ovde NE vraća — samo da li je priložen; čita
 * se kroz `[id]/izvod` (čl. 4b).
 *
 * Status svakog člana se izvodi (set 4.8.2): uslov pristupanja (čl. 7a) i izvod
 * (čl. 4b) zavise od njega.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const [lista, pristupanja] = await Promise.all([
    prisma.gazdinstvo.findMany({
      where: { status: { in: ["NA_PREGLEDU", "VRACENO", "ODOBRENO", "NACRT"] } },
      orderBy: [{ status: "asc" }, { podnetoAt: "asc" }],
      select: {
        id: true,
        naziv: true,
        naselje: true,
        lat: true,
        lng: true,
        opis: true,
        bpg: true,
        adresa: true,
        neregistrovano: true,
        status: true,
        razlogVracanja: true,
        podnetoAt: true,
        odobrenoAt: true,
        // Razgovor sa nosiocem (čl. 6a) — broj vidi samo admin i briše se odlukom.
        telefonZaRazgovor: true,
        razgovorObavljenAt: true,
        // Jedan razgovor (čl. 6a st. 2; set 4.8.3): ko je beležio i da li je sumnja.
        razgovorBeleziId: true,
        razgovorSumnja: true,
        rpgUporedjenAt: true,
        smeClanoveOd: true,
        upravljaId: true,
        izvodRpg: { select: { contentType: true, velicina: true, otpremljenAt: true } },
        clanovi: {
          where: { status: { in: ["PRISTUPIO", "ODOBREN"] } },
          orderBy: { pristupioAt: "asc" },
          select: {
            id: true,
            uloga: true,
            status: true,
            pristupioAt: true,
            izjavaTekst: true,
            userId: true,
            user: { select: { pseudonim: true, ...IZBOR_STATUSA, identitet: { select: { imePrezime: true } } } },
            doprinos: { select: { iznos: true, status: true, redniBroj: true } },
          },
        },
        oglasi: {
          where: { status: "ACTIVE", uklonjenAt: null },
          select: { id: true, title: true, category: true, tip: true, seller: { select: { pseudonim: true } } },
        },
      },
    }),
    prisma.clanGazdinstva.findMany({
      where: { status: "PRISTUPIO", gazdinstvo: { status: "ODOBRENO" } },
      orderBy: { pristupioAt: "asc" },
      select: {
        id: true,
        uloga: true,
        pristupioAt: true,
        izjavaTekst: true,
        user: { select: { pseudonim: true, ...IZBOR_STATUSA, identitet: { select: { imePrezime: true } } } },
        gazdinstvo: { select: { id: true, naziv: true, naselje: true } },
      },
    }),
  ]);

  // Članovi su punoletni (gazd. čl. 7 st. 1), pa je status izveden iz samog naloga.
  const prikazClana = (u: {
    pseudonim: string;
    maloletan: boolean;
    jeOsnivac: boolean;
    verified: boolean;
    indeksStvarnosti: number;
    potvrdjenAt: Date | null;
    tipKorisnika: string;
    identitet: { imePrezime: string } | null;
  }) => {
    const status = statusUcesnika(u);
    return { pseudonim: u.pseudonim, identitet: u.identitet, status, uKolu: pristupanjeSmeOdobriti(status) };
  };

  const gazdinstva = await Promise.all(
    lista.map(async (g) => {
      const clanovi = g.clanovi.map((c) => ({ ...c, user: prikazClana(c.user), pristupioAt: c.pristupioAt?.toISOString() ?? null }));
      // Podnosilac — prvi po redu pristupanja (čl. 2); od njegovog statusa zavisi izvod (čl. 4b).
      const podnosilac = clanovi[0] ?? null;
      const { izvodRpg, upravljaId, ...ostalo } = g;
      // Istupili članovi — i njih pogađa poništenje zbog lažne izjave (čl. 12 st. 2),
      // pa ih superadmin vidi pri odluci kome se izriče isključenje (st. 3; U5).
      const istupili = g.status === "ODOBRENO"
        ? await prisma.clanGazdinstva.findMany({
            where: { gazdinstvoId: g.id, status: "ISTUPIO" },
            orderBy: { pristupioAt: "asc" },
            select: { userId: true, user: { select: { pseudonim: true } } },
          })
        : [];
      return {
        ...ostalo,
        podnetoAt: g.podnetoAt?.toISOString() ?? null,
        odobrenoAt: g.odobrenoAt?.toISOString() ?? null,
        razgovorObavljenAt: g.razgovorObavljenAt?.toISOString() ?? null,
        rpgUporedjenAt: g.rpgUporedjenAt?.toISOString() ?? null,
        smeClanoveOd: g.smeClanoveOd?.toISOString() ?? null,
        izvod: izvodRpg
          ? { contentType: izvodRpg.contentType, velicina: izvodRpg.velicina, otpremljenAt: izvodRpg.otpremljenAt.toISOString() }
          : null,
        trebaIzvod: podnosilac ? trebaIzvod(podnosilac.user.status, !g.neregistrovano) : false,
        podnosilacUserId: podnosilac?.userId ?? null,
        odgovaraZaIzjavu: clanovi.find((c) => c.userId === upravljaId)?.user.pseudonim ?? null,
        clanovi,
        istupili: istupili.map((c) => ({ userId: c.userId, pseudonim: c.user.pseudonim })),
        vazecihOglasa: await brojOglasaUzPrijavu(g.id),
      };
    }),
  );

  return NextResponse.json({
    minOglasa: MIN_OGLASA_UZ_PRIJAVU,
    gazdinstva,
    pristupanja: pristupanja.map((p) => ({ ...p, user: prikazClana(p.user), pristupioAt: p.pristupioAt?.toISOString() ?? null })),
  });
}
