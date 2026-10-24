import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registarPredloga } from "@/lib/protokol/nabavka";
import { dohvatiGodisnjiProjektniPregled } from "@/lib/protokol/fondacija";

/**
 * GET /api/nabavke
 *
 * Registar predloga (zbirno, bez pseudonima — čl. 10 st. 2) i spisak nabavki, uz
 * zbirni godišnji pregled projekata (čl. 31 st. 4) — evidencija obima, ne granica.
 *
 * 🔴 Godišnja granica dinarske vrednosti preuzetih dobara po korisniku (bivši
 * čl. 21a) obrisana je odlukom vlasnika (19.10.2026, O-15) — ne vraćati je.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const [registar, nabavke, projekti] = await Promise.all([
    registarPredloga(),
    prisma.nabavka.findMany({
      where: { status: { in: ["OBJAVLJENA", "RED_UTVRDJEN", "PLACENA", "ZAVRSENA"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        poenPoDelu: true,
        brojDelova: true,
        velicinaDela: true,
        jedinicaMere: true,
        prijaveDo: true,
        naziv: { select: { naziv: true } },
        _count: { select: { prijave: true } },
      },
    }),
    dohvatiGodisnjiProjektniPregled(),
  ]);

  const moja = await prisma.nabavkaPrijava.findMany({
    where: { userId: session.user.id, nabavkaId: { in: nabavke.map((n) => n.id) } },
    select: { nabavkaId: true, status: true, mesto: true },
  });
  const mojePoNabavci = new Map(moja.map((m) => [m.nabavkaId, m]));

  return NextResponse.json({
    projekti,
    registar: registar.map((r) => ({
      nazivId: r.nazivId,
      naziv: r.naziv,
      brojKorisnika: r.brojKorisnika,
    })),
    nabavke: nabavke.map((n) => ({
      id: n.id,
      naziv: n.naziv.naziv,
      status: n.status,
      poenPoDelu: n.poenPoDelu,
      brojDelova: n.brojDelova,
      velicinaDela: n.velicinaDela,
      jedinicaMere: n.jedinicaMere,
      prijaveDo: n.prijaveDo?.toISOString() ?? null,
      brojPrijava: n._count.prijave,
      moja: mojePoNabavci.get(n.id) ?? null,
    })),
  });
}
