import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { smeGlasati } from "@/lib/dozvole";
import { prisma } from "@/lib/prisma";
import { izracunajGlasove } from "@/lib/protokol/zrno";
import { IZBOR_STATUSA } from "@/lib/protokol/status";
import { fazaPredloga } from "@/lib/protokol/glasanje";
import { dohvatiFazuStatus } from "@/lib/protokol/faza-sistema";

// POST /api/glasanje/[id]/glasaj — glasa ZA ili PROTIV
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  // Glasanje Gornjeg Kola je operativno tek u Fazi 2 (čl. 3, 24)
  const fazaSistema = await dohvatiFazuStatus();
  if (fazaSistema.faza !== "FAZA_2")
    return await greska("Glasanje Gornjeg Kola je operativno tek u Fazi 2.", 403);

  const { id } = await params;
  const predlog = await prisma.glasanjePredlog.findUnique({ where: { id } });
  if (!predlog) return await greska("Predlog nije pronađen.", 404);

  const faza = fazaPredloga(predlog);
  if (faza === "NAJAVLJEN") {
    const datum = predlog.glasanjePocetak.toLocaleDateString("sr-RS");
    return await greska(`Glasanje još nije počelo (počinje ${datum}).`, 400);
  }
  if (faza !== "U_TOKU")
    return await greska("Glasanje je završeno.", 400);

  // Glasa čuvar Kola sa aktiviranim ZRNOM (Pravilnik čl. 45, 46; Gornje Kolo
  // čl. 4, 12). `smeGlasati` čita SVEŽ zapis iz baze (ne sesiju): status se
  // proverava pri davanju glasa, a glas nosi moć perioda u kome je dat (čl. 6).
  const glasac = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ...IZBOR_STATUSA, zrnoStanje: { select: { aktivno: true } } },
  });
  if (!glasac || !smeGlasati(glasac, glasac.zrnoStanje?.aktivno ?? 0))
    return await greska("Glasa čuvar Kola sa aktiviranim ZRNOM.", 403);

  const glasovi = await izracunajGlasove(session.user.id);
  if (glasovi <= 0)
    return await greska("Nemate glasačku moć (potrebno aktivno ZRNO).", 403);

  const body = await req.json();

  // Izborno glasanje (Gornje Kolo čl. 8 st. 4): glas ide JEDNOJ mogućnosti, a `za`
  // ostaje null. Za/protiv listić i izborni listić su različiti govorni činovi i ne
  // smeju da se pomešaju — zato se oblik glasa izvodi iz VRSTE predloga, ne iz toga
  // šta je klijent poslao.
  if (predlog.vrsta === "IZBOR_NABAVKE") {
    const izbor = typeof body.izbor === "string" ? body.izbor : "";
    if (!izbor) return await greska("Izaberite jednu mogućnost sa liste.", 400);

    const postoji = await prisma.predlogNabavke.findFirst({
      where: { nazivId: izbor },
      select: { id: true },
    });
    if (!postoji) return await greska("Ta mogućnost nije u registru predloga.", 400);

    await prisma.glasanjeGlas.upsert({
      where: { predlogId_userId: { predlogId: id, userId: session.user.id } },
      create: { predlogId: id, userId: session.user.id, za: null, izbor, glasackaGlasova: glasovi },
      update: { za: null, izbor, glasackaGlasova: glasovi },
    });
    return NextResponse.json({ ok: true, glasackaGlasova: glasovi, izbor });
  }

  const za = body.za === true;

  // Upsert — dozvoljavamo izmenu glasa dok glasanje traje (čl. 11)
  await prisma.glasanjeGlas.upsert({
    where: { predlogId_userId: { predlogId: id, userId: session.user.id } },
    create: { predlogId: id, userId: session.user.id, za, izbor: null, glasackaGlasova: glasovi },
    update: { za, izbor: null, glasackaGlasova: glasovi },
  });

  return NextResponse.json({ ok: true, glasackaGlasova: glasovi });
}
