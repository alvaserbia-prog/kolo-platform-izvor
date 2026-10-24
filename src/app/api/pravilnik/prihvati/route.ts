import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/pravilnik/prihvati — vraća najnoviju verziju pravilnika koju korisnik NIJE prihvatio
 * POST /api/pravilnik/prihvati — korisnik prihvata verziju pravilnika
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const userId = session.user.id;

  const najnovija = await prisma.pravilnikVerzija.findFirst({
    where: { efektivnaOd: { lte: new Date() } },
    orderBy: { efektivnaOd: "desc" },
  });

  if (!najnovija) return NextResponse.json({ potrebno: false });

  const prihvaceno = await prisma.pravilnikPrihvatanje.findUnique({
    where: { userId_verzijaId: { userId, verzijaId: najnovija.id } },
  });

  if (prihvaceno) return NextResponse.json({ potrebno: false });

  return NextResponse.json({ potrebno: true, verzija: najnovija });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const userId = session.user.id;
  const body = await req.json();
  const { verzijaId } = body;

  if (!verzijaId) {
    return await greska("verzijaId je obavezno.", 400);
  }

  const verzija = await prisma.pravilnikVerzija.findUnique({ where: { id: verzijaId } });
  if (!verzija) return await greska("Verzija nije pronađena.", 404);

  await prisma.pravilnikPrihvatanje.upsert({
    where: { userId_verzijaId: { userId, verzijaId } },
    update: { prihvacen: true, createdAt: new Date() },
    create: { userId, verzijaId, prihvacen: true },
  });

  return NextResponse.json({ ok: true });
}
