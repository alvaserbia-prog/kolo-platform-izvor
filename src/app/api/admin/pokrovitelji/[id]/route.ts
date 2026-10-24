import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nemate pristup.", 403);
  }

  const { id } = await params;

  const pokrovitelj = await prisma.pokrovitelj.findUnique({
    where: { id },
    include: {
      vlasnik: { select: { pseudonim: true, email: true } },
      doprinosi: {
        include: { evidentirao: { select: { pseudonim: true } } },
        orderBy: { createdAt: "desc" },
      },
      bonusiEmisije: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!pokrovitelj) {
    return await greska("Pokrovitelj nije pronađen.", 404);
  }

  return NextResponse.json({
    id: pokrovitelj.id,
    naziv: pokrovitelj.naziv,
    pib: pokrovitelj.pib,
    bpg: pokrovitelj.bpg,
    adresa: pokrovitelj.adresa,
    kontaktEmail: pokrovitelj.kontaktEmail,
    kontaktTelefon: pokrovitelj.kontaktTelefon,
    vlasnikId: pokrovitelj.vlasnikId,
    vlasnikPseudonim: pokrovitelj.vlasnik.pseudonim,
    rsdKumulativ: Number(pokrovitelj.rsdKumulativ),
    trenutniNivo: pokrovitelj.trenutniNivo,
    status: pokrovitelj.status,
    createdAt: pokrovitelj.createdAt.toISOString(),
    doprinosi: pokrovitelj.doprinosi.map((d) => ({
      id: d.id,
      rsdIznos: Number(d.rsdIznos),
      tip: d.tip,
      evidentiraoPseudonim: d.evidentirao.pseudonim,
      napomena: d.napomena,
      createdAt: d.createdAt.toISOString(),
    })),
    bonusiEmisije: pokrovitelj.bonusiEmisije.map((b) => ({
      id: b.id,
      nivo: b.nivo,
      bonusPoen: b.bonusPoen,
      transactionId: b.transactionId,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nemate pristup.", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { naziv, adresa, kontaktEmail, kontaktTelefon, status } = body;

  await prisma.pokrovitelj.update({
    where: { id },
    data: {
      ...(naziv !== undefined && { naziv }),
      ...(adresa !== undefined && { adresa }),
      ...(kontaktEmail !== undefined && { kontaktEmail: kontaktEmail || null }),
      ...(kontaktTelefon !== undefined && { kontaktTelefon }),
      ...(status !== undefined && { status }),
    },
  });

  // U detalje idu samo imena izmenjenih polja — kontakt podaci (email/telefon)
  // ne smeju u audit log (preduzetnik može biti fizičko lice).
  await logAdminAkcija(session.user.id, "POKROVITELJ_AZURIRAN", id,
    `izmenjena polja: ${Object.keys(body).join(", ") || "—"}`);

  return NextResponse.json({ ok: true });
}
