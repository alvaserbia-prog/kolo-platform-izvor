import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { granicePeriodaGlasanja, fazaPredloga, zatvoriIstekleIObjaviIshod, postojiSkoroOdbijen, jeUSastavuGornjegKola } from "@/lib/protokol/glasanje";
import { dohvatiFazuStatus } from "@/lib/protokol/faza-sistema";

// GET /api/glasanje — lista predloga
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  // Zatvori istekle i utvrdi ishod (čl. 13)
  await zatvoriIstekleIObjaviIshod();

  const predlozi = await prisma.glasanjePredlog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { pseudonim: true } },
      _count: { select: { glasovi: true } },
    },
  });

  return NextResponse.json({
    predlozi: predlozi.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      authorPseudonim: p.author.pseudonim,
      glasanjePocetak: p.glasanjePocetak.toISOString(),
      deadline: p.deadline.toISOString(),
      status: p.status,
      faza: fazaPredloga(p),
      ishodUsvojen: p.ishodUsvojen,
      zaZbir: p.zaZbir,
      protivZbir: p.protivZbir,
      brGlasova: p._count.glasovi,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

// POST /api/glasanje — kreiraj predlog
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  // Glasanje Gornjeg Kola je operativno tek u Fazi 2 (čl. 3, 24)
  const faza = await dohvatiFazuStatus();
  if (faza.faza !== "FAZA_2")
    return await greska("Glasanje Gornjeg Kola je operativno tek u Fazi 2.", 403);

  // Predlog podnosi čuvar Kola sa najmanje jednim aktivnim ZRNOM (Gornje Kolo
  // čl. 10). Član bez potvrde sa ZRNOM i korisnik kome je ZRNO zamrznuto ne
  // predlažu (Pravilnik čl. 28a, 30 st. 3). Status se čita iz baze.
  if (!(await jeUSastavuGornjegKola(session.user.id)))
    return await greska("Predlog podnosi čuvar Kola sa aktiviranim ZRNOM.", 403);

  const body = await req.json();
  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const vrsta = body.vrsta === "DINARSKA_PREPORUKA" ? "DINARSKA_PREPORUKA" : "ODLUKA";

  if (!title || title.length < 5)
    return await greska("Naslov mora imati najmanje 5 znakova.", 400);
  if (!description || description.length < 20)
    return await greska("Opis mora imati najmanje 20 znakova.", 400);

  // Neusvojen predlog iste sadržine ne sme ponovo pre 30 dana (čl. 22)
  if (await postojiSkoroOdbijen(title))
    return await greska("Predlog iste sadržine je nedavno odbijen — ponovno predlaganje moguće je tek po isteku 30 dana (čl. 22).", 400);

  // Rok ne određuje predlagač — glasanje je u narednom obračunskom periodu (čl. 11)
  const { glasanjePocetak, deadline } = granicePeriodaGlasanja(new Date());

  const predlog = await prisma.glasanjePredlog.create({
    data: { title, description, vrsta, authorId: session.user.id, glasanjePocetak, deadline },
  });

  return NextResponse.json({ ok: true, id: predlog.id });
}
