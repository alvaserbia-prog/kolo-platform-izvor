import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nemate pristup.", 403);
  }

  const pokrovitelji = await prisma.pokrovitelj.findMany({
    include: {
      vlasnik: { select: { pseudonim: true } },
      _count: { select: { doprinosi: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    pokrovitelji.map((p) => ({
      id: p.id,
      naziv: p.naziv,
      pib: p.pib,
      bpg: p.bpg,
      adresa: p.adresa,
      kontaktEmail: p.kontaktEmail,
      kontaktTelefon: p.kontaktTelefon,
      vlasnikId: p.vlasnikId,
      vlasnikPseudonim: p.vlasnik.pseudonim,
      rsdKumulativ: Number(p.rsdKumulativ),
      status: p.status,
      brDoprinosa: p._count.doprinosi,
      createdAt: p.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nemate pristup.", 403);
  }

  const body = await req.json();
  const { naziv, pib, adresa, kontaktEmail, kontaktTelefon, vlasnikId } = body;

  if (!naziv?.trim() || !pib?.trim() || !vlasnikId) {
    return await greska("Naziv, PIB i vlasnik su obavezni.", 400);
  }

  const vlasnik = await prisma.user.findUnique({
    where: { id: vlasnikId },
    select: { verified: true, pseudonim: true },
  });
  if (!vlasnik || !vlasnik.verified) {
    return await greska("Vlasnik mora biti verifikovan član.", 400);
  }

  const existing = await prisma.pokrovitelj.findUnique({ where: { pib: pib.trim() } });
  if (existing) {
    return await greska("Pokrovitelj sa ovim PIB-om već postoji.", 400);
  }

  const pokrovitelj = await prisma.pokrovitelj.create({
    data: {
      naziv: naziv.trim(),
      pib: pib.trim(),
      adresa: adresa?.trim() || null,
      kontaktEmail: kontaktEmail?.trim() || null,
      kontaktTelefon: kontaktTelefon?.trim() || null,
      vlasnikId,
      kreiraoId: session.user.id,
    },
  });

  await logAdminAkcija(session.user.id, "POKROVITELJ_KREIRAN", pokrovitelj.id,
    `Naziv: ${pokrovitelj.naziv}, PIB: ${pokrovitelj.pib}, Vlasnik: ${vlasnik.pseudonim}`);

  return NextResponse.json({ id: pokrovitelj.id }, { status: 201 });
}
