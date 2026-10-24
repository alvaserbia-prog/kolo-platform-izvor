/**
 * GET /api/verifikacija/moj-indeks
 *
 * Vraća status (set 4.8.2), tip i interni indeks logovanog korisnika. Ekran „Moj
 * kod" po promeni statusa prepoznaje da je verifikacija ili potvrda upisana — i kad
 * se tip i indeks ne menjaju (član bez potvrde → član Kola). Indeks se ne prikazuje.
 * Kapacitet i slotovi su ukinuti setom 4.7.5 (dokaz stvarnosti čl. 8).
 */
import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ucitajStatus } from "@/lib/protokol/status";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Nisi prijavljen.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      tipKorisnika: true,
      indeksStvarnosti: true,
      _count: { select: { verifikacijeKojeSamObavio: true } },
    },
  });
  if (!user) {
    return await greska("Korisnik ne postoji.", 404);
  }


  const status = await ucitajStatus(session.user.id);

  return NextResponse.json({
    status,
    tip: user.tipKorisnika,
    indeks: user.indeksStvarnosti,
    brojVerifikacijaObavljenih: user._count.verifikacijeKojeSamObavio,
  });
}
