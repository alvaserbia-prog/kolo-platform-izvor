import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeSuperadmin } from "@/lib/dozvole";
import { trenutakStupanja } from "@/lib/politika-stupanje-pravila";

/**
 * GET /api/admin/politika — lista svih verzija Politike
 * POST /api/admin/politika — kreira novu verziju i, ako je izabrano, odmah obaveštava
 *                            sve aktivne korisnike. Pristanak se traži od dana stupanja
 *                            na snagu (`efektivnaOd`, GGGG-MM-DD; bez njega od upisa).
 *                            Dan sme biti u budućnosti: izmena se objavljuje PRE
 *                            stupanja na snagu (Uslovi čl. 43 st. 3, Pravilnik čl. 57 st. 2).
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
    // Isti redosled kao `pristanakStatus()`; verzije upisane unapred su na vrhu.
    orderBy: [{ efektivnaOd: "desc" }, { createdAt: "desc" }, { id: "desc" }],
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

  let body: { verzija?: unknown; naslov?: unknown; obavesti?: unknown; efektivnaOd?: unknown };
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
  const stupanje = trenutakStupanja(body.efektivnaOd);
  if (!stupanje.ok) return await greska(stupanje.razlog, 400);

  // Proveri jedinstvenost verzije
  const postoji = await prisma.politikaVerzija.findUnique({ where: { verzija } });
  if (postoji) {
    return await greska("Ta verzija već postoji.", 409);
  }

  // Pristanak se traži od dana stupanja na snagu; čitaoci (`pristanakStatus`,
  // `upisiPrihvatanjeTekuceVerzije`) uzimaju samo verzije sa `efektivnaOd <= sada`,
  // pa verzija upisana unapred ne traži ništa pre svog dana.
  const novaVerzija = await prisma.politikaVerzija.create({
    data: {
      verzija,
      naslov,
      efektivnaOd: stupanje.efektivnaOd,
      kreirao: session.user.id,
    },
  });

  // Obaveštenje ide ODMAH pri upisu, dakle pre dana stupanja na snagu (Uslovi čl. 43
  // st. 3, Pravilnik čl. 57 st. 2, Politika čl. 47) — po izboru, jer ga vlasnik ponekad
  // šalje zasebno, kroz cirkularno obaveštenje sa pravnim osnovom.
  let obavesteno = 0;
  if (body.obavesti === true) {
    const korisnici = await prisma.user.findMany({
      where: { status: "ACTIVE", deaktiviranAt: null },
      select: { id: true },
    });
    if (korisnici.length > 0) {
      const datum = stupanje.efektivnaOd.toLocaleDateString("sr-RS", { timeZone: "Europe/Belgrade" });
      const r = await prisma.notifikacija.createMany({
        data: korisnici.map((k) =>
          stupanje.unapred
            ? {
                userId: k.id,
                tip: "info",
                kljuc: "notifikacije.akti_izmenjeni_od",
                parametri: { verzija, datum },
                naslov: "Akti KOLO sistema se menjaju",
                tekst: `Objavljena je nova verzija akata (${verzija}: ${naslov}), koja stupa na snagu ${datum}. Od tog dana, pri ulasku na platformu, potvrdi pristanak.`,
                link: "/pravilnik",
              }
            : {
                userId: k.id,
                tip: "info",
                kljuc: "notifikacije.akti_izmenjeni",
                parametri: { verzija },
                naslov: "Akti KOLO sistema su izmenjeni",
                tekst: `Doneta je nova verzija akata (${verzija}: ${naslov}). Pri sledećem ulasku na platformu potvrdi pristanak.`,
                link: "/politika-prihvati",
              },
        ),
        skipDuplicates: true,
      });
      obavesteno = r.count;
    }
  }

  await logAdminAkcija(session.user.id, "POLITIKA_NOVA_VERZIJA", novaVerzija.id, `v${verzija}: ${naslov}; na snazi od ${stupanje.efektivnaOd.toISOString()}; obavešteno ${obavesteno}`);

  return NextResponse.json({ ...novaVerzija, obavesteno }, { status: 201 });
}
