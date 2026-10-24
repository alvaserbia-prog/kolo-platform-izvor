/**
 * GET /api/nadzor
 *
 * Sve što čeka nadzor ovog nadzornika: verifikacije, potvrde člana bez potvrde i
 * potvrde postojanja deteta (dokaz stvarnosti čl. 10, set 4.8.2). Dostupno samo
 * čuvaru Kola (`mozeNadzor`). Filtrira predmete u kojima je nadzornik učestvovao.
 */
import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listajZaNadzor } from "@/lib/protokol/nadzor-service";
import { mozeNadzor } from "@/lib/dozvole";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Nisi prijavljen.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tipKorisnika: true, maloletan: true, jeOsnivac: true, verified: true, indeksStvarnosti: true, potvrdjenAt: true },
  });
  if (!user || !mozeNadzor(user)) {
    return await greska("Nemaš ovlašćenje za nadzor (čl. 10 Pravilnika).", 403);
  }

  const lista = await listajZaNadzor(session.user.id);
  return NextResponse.json({
    // Ime ključa ostaje (stari klijenti); stavke nose `vrstaPredmeta`.
    verifikacije: lista.map((v) => ({
      vrstaPredmeta: v.vrstaPredmeta,
      id: v.id,
      verifikator: v.davalac,
      verifikovani: v.primalac,
      vrstaVerifikacije: v.vrstaVerifikacije,
      poPozivu: v.poPozivu,
      verifikatorBezPotvrde: v.verifikatorBezPotvrde,
      izvor: v.izvor,
      korak: v.korak,
      datum: v.datum.toISOString(),
    })),
  });
}
