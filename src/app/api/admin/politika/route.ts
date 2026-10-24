import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeSuperadmin } from "@/lib/dozvole";

/**
 * GET /api/admin/politika — lista svih verzija Politike
 * POST /api/admin/politika — kreira novu verziju (od tog trenutka se traži pristanak)
 *                            i, ako je izabrano, obaveštava sve aktivne korisnike
 *
 * 🔴 Nova verzija se NE pravi sama pri bumpu akata — vlasnik odlučuje kada se
 * pristanak traži (odluka 18.10.2026). Tab Admin → Politika, samo superadmin.
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) {
    return await greska("Nije ovlašćen.", 403);
  }

  const verzije = await prisma.politikaVerzija.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pristanci: true } },
    },
  });

  return NextResponse.json(verzije);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) {
    return await greska("Nije ovlašćen.", 403);
  }

  let body: { verzija?: unknown; naslov?: unknown; obavesti?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  const verzija = typeof body.verzija === "string" ? body.verzija.trim() : "";
  const naslov = typeof body.naslov === "string" ? body.naslov.trim() : "";
  if (!verzija || !naslov) {
    return await greska("Polja verzija i naslov su obavezna.", 400);
  }

  // Proveri jedinstvenost verzije
  const postoji = await prisma.politikaVerzija.findUnique({ where: { verzija } });
  if (postoji) {
    return await greska("Ta verzija već postoji.", 409);
  }

  // Pristanak se traži od trenutka upisa: akti stupaju na snagu danom donošenja
  // (Uslovi čl. 40, Politika čl. 16), pa nema roka koji bi se upisivao unapred.
  const novaVerzija = await prisma.politikaVerzija.create({
    data: {
      verzija,
      naslov,
      efektivnaOd: new Date(),
      kreirao: session.user.id,
    },
  });

  // Obaveštenje bez odlaganja (Uslovi čl. 40, Politika čl. 16) — po izboru, jer ga
  // vlasnik ponekad šalje zasebno, kroz cirkularno obaveštenje sa pravnim osnovom.
  let obavesteno = 0;
  if (body.obavesti === true) {
    const korisnici = await prisma.user.findMany({
      where: { status: "ACTIVE", deaktiviranAt: null },
      select: { id: true },
    });
    if (korisnici.length > 0) {
      const r = await prisma.notifikacija.createMany({
        data: korisnici.map((k) => ({
          userId: k.id,
          tip: "info",
          kljuc: "notifikacije.akti_izmenjeni",
          parametri: { verzija },
          naslov: "Akti KOLO sistema su izmenjeni",
          tekst: `Doneta je nova verzija akata (${verzija}: ${naslov}). Pri sledećem ulasku na platformu potvrdi pristanak.`,
          link: "/politika-prihvati",
        })),
        skipDuplicates: true,
      });
      obavesteno = r.count;
    }
  }

  await logAdminAkcija(session.user.id, "POLITIKA_NOVA_VERZIJA", novaVerzija.id, `v${verzija}: ${naslov}; obavešteno ${obavesteno}`);

  return NextResponse.json({ ...novaVerzija, obavesteno }, { status: 201 });
}
