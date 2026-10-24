/**
 * GET /api/verifikacija/lanac/[korisnikId]
 *
 * Vraća verifikatora i listu verifikovanih (mini-stablo) za datog korisnika sa
 * pseudonimima. Graf verifikacija je deo podataka koji se NIKADA ne izlažu javno
 * (Politika privatnosti čl. 6) — dostupan je isključivo verifikovanim učesnicima
 * (Pravilnik čl. 67; član bez potvrde vidi graf kao i član Kola).
 *
 * Uz svaki čvor ide vrsta verifikacije (potvrda / uvođenje u Kolo, dokaz čl. 5a, 6)
 * i da li je uvedeni u međuvremenu potvrđen.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ korisnikId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!session.user.verified) return await greska("Verifikacija potrebna.", 403);

  const { korisnikId } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id: korisnikId },
    select: {
      id: true,
      pseudonim: true,
      tipKorisnika: true,
      jeOsnivac: true,
      indeksStvarnosti: true,
      verifikacijeKojeSuMeVerifikovale: {
        orderBy: { vremenskiZig: "asc" },
        select: {
          vremenskiZig: true,
          nadzornikId: true,
          podlezeNadzoru: true,
          vrsta: true,
          potvrdeClana: { where: { aktivnaKljuc: { not: null } }, select: { id: true }, take: 1 },
          verifikator: { select: { id: true, pseudonim: true } },
        },
      },
      verifikacijeKojeSamObavio: {
        orderBy: { vremenskiZig: "asc" },
        select: {
          vremenskiZig: true,
          nadzornikId: true,
          podlezeNadzoru: true,
          vrsta: true,
          potvrdeClana: { where: { aktivnaKljuc: { not: null } }, select: { id: true }, take: 1 },
          verifikovani: { select: { id: true, pseudonim: true } },
        },
      },
    },
  });

  if (!user) {
    return await greska("Korisnik ne postoji.", 404);
  }


  const verifikatori = user.verifikacijeKojeSuMeVerifikovale.map((v) => ({
    id: v.verifikator.id,
    pseudonim: v.verifikator.pseudonim,
    datum: v.vremenskiZig.toISOString(),
    vrsta: v.vrsta,
    potvrdjen: v.vrsta === "POTVRDA" || v.potvrdeClana.length > 0,
    statusNadzora: !v.podlezeNadzoru
      ? "ne-podleze"
      : v.nadzornikId
        ? "nadzirano"
        : "ceka-nadzor",
  }));

  const verifikovani = user.verifikacijeKojeSamObavio.map((v) => ({
    id: v.verifikovani.id,
    pseudonim: v.verifikovani.pseudonim,
    datum: v.vremenskiZig.toISOString(),
    vrsta: v.vrsta,
    potvrdjen: v.vrsta === "POTVRDA" || v.potvrdeClana.length > 0,
    statusNadzora: !v.podlezeNadzoru
      ? "ne-podleze"
      : v.nadzornikId
        ? "nadzirano"
        : "ceka-nadzor",
  }));

  return NextResponse.json({
    korisnik: {
      id: user.id,
      pseudonim: user.pseudonim,
      tip: user.tipKorisnika,
      jeOsnivac: user.jeOsnivac,
      indeks: user.indeksStvarnosti,
    },
    verifikatori,
    verifikovani,
  });
}
