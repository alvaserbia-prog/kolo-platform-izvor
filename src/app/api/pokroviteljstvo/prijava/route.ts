import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { podnesiNovcanuPrijavu, PrijavaPokroviteljstvaGreska } from "@/lib/protokol/pokrovitelj";
import { dohvatiIpsConfig, pozivNaBrojZaPrijavu, prikazPozivNaBroj } from "@/lib/placanje/ips-qr";
import { RACUN_FONDACIJE } from "@/lib/placanje/racun-fondacije";

// GET /api/pokroviteljstvo/prijava[?upisId=] — sopstvene prijave (po upisu, ako je dat)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const upisId = req.nextUrl.searchParams.get("upisId");

  const prijave = await prisma.pokroviteljPrijava.findMany({
    where: { podnosilacId: session.user.id, ...(upisId ? { upisId } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      vrstaDavaoca: true,
      naziv: true,
      pib: true,
      bpg: true,
      maticniBroj: true,
      adresaSedista: true,
      zastupnikImePrezime: true,
      zastupnikFunkcija: true,
      vrstaDonacije: true,
      vrednostRsd: true,
      logoUrl: true,
      ugovorTekst: true,
      status: true,
      odbijenoRazlog: true,
      potpisanoAt: true,
      potvrdjenoAt: true,
      createdAt: true,
      // Set 5.0.9 (donacije čl. 20 st. 2): poseban poziv na broj i potvrda o uplati.
      pozivBroj: true,
      potvrdaPoslataAt: true,
    },
  });

  return NextResponse.json({
    prijave: prijave.map((p) => ({
      ...p,
      vrednostRsd: Number(p.vrednostRsd),
      potpisanoAt: p.potpisanoAt?.toISOString() ?? null,
      potvrdjenoAt: p.potvrdjenoAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      pozivBroj: undefined,
      pozivNaBroj: p.vrstaDonacije === "NOVAC" ? prikazPozivNaBroj(pozivNaBrojZaPrijavu(p.pozivBroj)) : null,
      potvrdaPoslata: p.potvrdaPoslataAt !== null,
      potvrdaPoslataAt: undefined,
    })),
    racun: (dohvatiIpsConfig()?.racun ?? RACUN_FONDACIJE).replace(/^(\d{3})(\d{13})(\d{2})$/, "$1-$2-$3"),
  });
}

// POST /api/pokroviteljstvo/prijava — prijava novčanog pokroviteljstva (čl. 19) iz
// ODOBRENOG upisa (čl. 18 st. 3): telo nosi samo `upisId` i iznos. Podaci o pokrovitelju
// i zastupniku su snimak upisa; ugovor se generiše iz njih (`podnesiNovcanuPrijavu`). Od seta
// 4.7.9 i iz upisa registrovanog gazdinstva (čl. 15 st. 1, 16 st. 4).
// Verifikacija nije uslov: novčano pokroviteljstvo podnosi i korisnik (donacije
// čl. 16 st. 1, 20 st. 4). Potvrđen prijem ga NE potvrđuje — samo ga vodi na spisak za
// poziv (dokaz stvarnosti čl. 8 st. 1 t. 3). 🔴 Maloletni nalog ne podnosi prijavu (čl. 16 st. 1).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => ({}));
  try {
    const prijava = await podnesiNovcanuPrijavu(
      session.user.id,
      typeof body.upisId === "string" ? body.upisId : "",
      Number(body.vrednostRsd),
    );
    return NextResponse.json({ ok: true, id: prijava.id });
  } catch (e) {
    if (e instanceof PrijavaPokroviteljstvaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
