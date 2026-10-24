import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { izracunajGlasove } from "@/lib/protokol/zrno";
import { fazaPredloga, zatvoriIstekleIObjaviIshod } from "@/lib/protokol/glasanje";

// GET /api/glasanje/[id] — detalji predloga + rezultati
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;

  // Zatvori istekle i utvrdi ishod (čl. 13)
  await zatvoriIstekleIObjaviIshod();

  const predlog = await prisma.glasanjePredlog.findUnique({
    where: { id },
    include: {
      author: { select: { pseudonim: true } },
      glasovi: true,
    },
  });

  if (!predlog) return await greska("Predlog nije pronađen.", 404);

  const mojGlas = predlog.glasovi.find((g) => g.userId === session.user.id);
  const zaGlasova = predlog.glasovi.filter((g) => g.za).reduce((s, g) => s + g.glasackaGlasova, 0);
  const protiGlasova = predlog.glasovi.filter((g) => !g.za).reduce((s, g) => s + g.glasackaGlasova, 0);

  // Moja glasačka moć (za prikaz)
  const mojGlasoviBroj = await izracunajGlasove(session.user.id);

  return NextResponse.json({
    id: predlog.id,
    title: predlog.title,
    description: predlog.description,
    authorPseudonim: predlog.author.pseudonim,
    glasanjePocetak: predlog.glasanjePocetak.toISOString(),
    deadline: predlog.deadline.toISOString(),
    status: predlog.status,
    faza: fazaPredloga(predlog),
    ishodUsvojen: predlog.ishodUsvojen,
    zaGlasova,
    protiGlasova,
    mojGlas: mojGlas ? { za: mojGlas.za, glasackaGlasova: mojGlas.glasackaGlasova } : null,
    mojGlasoviBroj,
    createdAt: predlog.createdAt.toISOString(),
  });
}
