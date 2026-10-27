import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { upisOdobrenZaPotvrdu } from "@/lib/upis-pokrovitelja-pravila";

// GET /api/admin/pokroviteljstvo/prijave — sve prijave pokroviteljstva
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const prijave = await prisma.pokroviteljPrijava.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      podnosilac: { select: { pseudonim: true } },
      upis: { select: { status: true, aprProveraAt: true, odlukaAt: true, vrsta: true } },
    },
  });

  return NextResponse.json(
    prijave.map((p) => ({
      id: p.id,
      podnosilacPseudonim: p.podnosilac.pseudonim,
      naziv: p.naziv,
      // Gazdinstvo (set 4.7.9): umesto PIB-a, MB-a i sedišta nosi BPG.
      vrstaDavaoca: p.vrstaDavaoca,
      pib: p.pib,
      bpg: p.bpg,
      maticniBroj: p.maticniBroj,
      adresaSedista: p.adresaSedista,
      // Zastupnik se pokazuje samo administratorskom timu — radi poređenja sa APR-om.
      zastupnikImePrezime: p.zastupnikImePrezime,
      zastupnikFunkcija: p.zastupnikFunkcija,
      aprUporedjenAt: p.aprUporedjenAt?.toISOString() ?? null,
      // Upis (donacije čl. 16, 18): poređenje sa registrom izvršeno je pri odobrenju upisa.
      upisId: p.upisId,
      upisOdobren: !!p.upis && upisOdobrenZaPotvrdu(p.upis),
      vrstaDonacije: p.vrstaDonacije,
      vrednostRsd: Number(p.vrednostRsd),
      logoUrl: p.logoUrl,
      status: p.status,
      odbijenoRazlog: p.odbijenoRazlog,
      createdAt: p.createdAt.toISOString(),
    }))
  );
}
