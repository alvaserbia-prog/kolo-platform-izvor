import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { jeAdmin } from "@/lib/dozvole";

/**
 * GET  /api/bagovi — lista prijava grešaka sa statusom
 * POST /api/bagovi — prijavi novi bag
 *
 * 🔴 Ko vidi šta (Politika čl. 32 st. 4–5):
 * — Spisak prijava (naslov, pseudonim prijavioca, status) vide PUNOLETNI prijavljeni
 *   korisnici. Maloletni korisnik vidi samo sopstvene prijave.
 * — Pseudonim maloletnog prijavioca ne ide punoletnima (profil i pseudonim deteta
 *   se punoletnima ne otvaraju) — vidi ga samo administratorski tim.
 * — Opis i odgovor (slobodan tekst) vidi samo podnosilac i administratorski tim;
 *   na spisku za ostale ih nema.
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const admin = jeAdmin(session.user);
  const maloletan = session.user.maloletan === true;

  const bagovi = await prisma.bug.findMany({
    // Maloletni vidi samo svoje prijave (spisak je za punoletne, čl. 32 st. 4).
    where: maloletan && !admin ? { userId: session.user.id } : {},
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      naslov: true,
      opis: true,
      status: true,
      odgovor: true,
      resenoAt: true,
      createdAt: true,
      userId: true,
      user: { select: { pseudonim: true, maloletan: true } },
    },
  });

  return NextResponse.json(
    bagovi.map((b) => {
      const moj = b.userId === session.user.id;
      const punUvid = moj || admin;
      return {
        id: b.id,
        naslov: b.naslov,
        opis: punUvid ? b.opis : null,
        status: b.status,
        odgovor: punUvid ? b.odgovor : null,
        resenoAt: b.resenoAt,
        createdAt: b.createdAt,
        // Pseudonim maloletnog prijavioca vidi samo on sam i administratorski tim.
        prijavio: b.user.maloletan && !punUvid ? null : b.user.pseudonim,
        mojBag: moj,
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const body = await req.json();
  const naslov = typeof body.naslov === "string" ? body.naslov.trim() : "";
  const opis = typeof body.opis === "string" ? body.opis.trim() : "";

  if (naslov.length < 3) {
    return await greska("Naslov mora imati najmanje 3 znaka.", 400);
  }
  if (opis.length < 10) {
    return await greska("Opis mora imati najmanje 10 znakova.", 400);
  }

  // Spreči spam: najviše 5 otvorenih prijava po korisniku.
  const otvoreni = await prisma.bug.count({
    where: { userId: session.user.id, status: { in: ["PRIJAVLJEN", "U_RADU"] } },
  });
  if (otvoreni >= 5) {
    return await greska("Imate previše otvorenih prijava. Sačekajte da se postojeće obrade.", 429);
  }

  const bag = await prisma.bug.create({
    data: { userId: session.user.id, naslov: naslov.slice(0, 200), opis: opis.slice(0, 4000) },
  });

  void posaljiAdminAlert(
    "Nova prijava baga",
    `Naslov: ${naslov}\nPrijavio: ${session.user.pseudonim}`
  );

  return NextResponse.json({ ok: true, id: bag.id }, { status: 201 });
}
