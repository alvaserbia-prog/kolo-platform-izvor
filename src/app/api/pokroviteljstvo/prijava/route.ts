import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generisiUgovorTekst, MINIMUM_PRIJAVE_POKROVITELJSTVA } from "@/lib/protokol/pokrovitelj";
import { upisSpremanZaPrijavu, funkcijaZaUgovor } from "@/lib/protokol/upis-pokrovitelja";
import { FUNKCIJA_NOSIOCA_GAZDINSTVA } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { imeNaloga, ishodUpisa, PORUKA_DRUGO_IME } from "@/lib/protokol/identitet";
import { VrstaDonacije } from "@/generated/prisma/client";

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
    },
  });

  return NextResponse.json({
    prijave: prijave.map((p) => ({
      ...p,
      vrednostRsd: Number(p.vrednostRsd),
      potpisanoAt: p.potpisanoAt?.toISOString() ?? null,
      potvrdjenoAt: p.potvrdjenoAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

// POST /api/pokroviteljstvo/prijava — prijava novčanog pokroviteljstva (čl. 7) iz
// ODOBRENOG upisa (čl. 6a): telo nosi samo `upisId` i iznos. Podaci o pokrovitelju
// i zastupniku su snimak upisa; ugovor se generiše iz njih. Od seta 4.7.9 i iz
// upisa registrovanog gazdinstva (čl. 6): nosilac je strana ugovora, uz naziv i BPG.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Verifikacija nije uslov: novčano pokroviteljstvo podnosi i korisnik (donacije
  // čl. 8; tabela dozvola br. 34). Potvrđen prijem ga NE potvrđuje — samo ga vodi na
  // spisak za poziv (dokaz stvarnosti čl. 4a st. 2 t. 3, set 4.8.2). Ostaje uslov
  // punoletstva.
  // 🔴 Maloletni nalog ne podnosi prijavu (donacije čl. 6a st. 1, set 4.7.7). Čita se iz baze,
  // ne iz tokena — status se menja prevođenjem naloga.
  const podnosilac = await prisma.user.findUnique({ where: { id: session.user.id }, select: { maloletan: true } });
  if (!podnosilac || podnosilac.maloletan)
    return await greska("Prijavu pokroviteljstva ne može podneti maloletni korisnik.", 403);

  const body = await req.json().catch(() => ({}));
  const vrednostRsd = Number(body.vrednostRsd);
  if (!vrednostRsd || isNaN(vrednostRsd) || vrednostRsd <= 0)
    return await greska("Vrednost donacije mora biti pozitivna.", 400);
  // Najmanja prijava (čl. 7) — ispod toga ugovor, potpis i knjiženje koštaju
  // više nego što donacija vredi.
  if (vrednostRsd < MINIMUM_PRIJAVE_POKROVITELJSTVA)
    return await greska(
      `Najmanji iznos pokroviteljstva je ${MINIMUM_PRIJAVE_POKROVITELJSTVA.toLocaleString("sr-RS")} RSD.`,
      400
    );

  // 🔴 Upis je uslov prijave (čl. 6a st. 6, čl. 7 st. 1): odobren, neobrisan, vodi ga podnosilac.
  const upisId = typeof body.upisId === "string" ? body.upisId : "";
  const upis = upisId ? await prisma.upisPokrovitelja.findUnique({ where: { id: upisId } }) : null;
  if (!upis) return await greska("Prijava se podnosi iz upisa pokrovitelja u evidenciju.", 400);
  const spreman = upisSpremanZaPrijavu(upis, {
    userId: session.user.id,
    vrstaPrijave: "NOVAC",
    naListiZabrane: false,
  });
  if (!spreman.ok) return await greska(spreman.razlog, upis.vlasnikUserId === session.user.id ? 409 : 403);

  // Jedan nalog, jedno ime (Pravilnik čl. 31a st. 3): ime iz upisa mora biti ime
  // uz ovaj nalog, ako je upisano. Upis u evidenciju identiteta ide pri potvrdi prijema.
  const zastupnikImePrezime = upis.imePrezime!;
  if (ishodUpisa(await imeNaloga(session.user.id), zastupnikImePrezime) === "RAZLIKUJE_SE")
    return await greska(PORUKA_DRUGO_IME, 409);

  const gazdinstvo = upis.vrsta === "GAZDINSTVO";
  const podaci = {
    vrstaDavaoca: upis.vrsta,
    naziv: upis.naziv,
    pib: gazdinstvo ? null : upis.pib!,
    maticniBroj: gazdinstvo ? null : upis.maticniBroj!,
    adresaSedista: gazdinstvo ? null : upis.adresaSedista!,
    bpg: gazdinstvo ? upis.bpg! : null,
    zastupnikImePrezime,
    zastupnikFunkcija: gazdinstvo ? FUNKCIJA_NOSIOCA_GAZDINSTVA : funkcijaZaUgovor(upis),
  };
  const vrstaDonacije: VrstaDonacije = "NOVAC";
  const ugovorTekst = generisiUgovorTekst({ ...podaci, vrstaDonacije, vrednostRsd });

  const prijava = await prisma.pokroviteljPrijava.create({
    data: {
      podnosilacId: session.user.id,
      upisId: upis.id,
      ...podaci,
      vrstaDonacije,
      vrednostRsd,
      logoUrl: upis.logoUrl,
      ugovorTekst,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: prijava.id });
}
