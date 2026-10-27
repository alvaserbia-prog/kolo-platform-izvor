/**
 * GET /api/verifikacija/lanac/[korisnikId]
 *
 * Vraća verifikatora i listu verifikovanih (mini-stablo) za datog korisnika sa
 * pseudonimima.
 *
 * 🔴 Evidencija lanca potvrda, uključujući vrstu verifikacije i podatke o nadzoru,
 * NIJE dostupna drugim korisnicima (Politika čl. 15 st. 7; Pravilnik čl. 30 st. 5 i
 * čl. 56 st. 3 — dostupnost evidencije doprinosa ne obuhvata lanac potvrda). Ruta
 * zato vraća lanac samo onome na koga se odnosi i administratorskom timu. Spisak
 * povezanih (dokaz stvarnosti čl. 17) ima sopstveni put i nije ovaj izuzetak.
 * Podaci o nadzoru ne prikazuju se ni verifikatoru ni verifikovanom (čl. 15 st. 7),
 * pa ih dobija samo administratorski tim.
 *
 * Uz svaki čvor ide vrsta verifikacije (potvrda / uvođenje u Kolo, dokaz čl. 4, 18)
 * i da li je uvedeni u međuvremenu potvrđen.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ korisnikId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { korisnikId } = await ctx.params;
  const admin = jeAdmin(session.user);
  // Samo sopstveni lanac (i administratorski tim) — Politika čl. 15 st. 7.
  if (korisnikId !== session.user.id && !admin) {
    return await greska("Evidencija lanca potvrda nije dostupna drugim korisnicima.", 403);
  }

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
    // Podaci o nadzoru samo administratorskom timu (čl. 15 st. 7).
    statusNadzora: !admin || !v.podlezeNadzoru
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
    // Podaci o nadzoru samo administratorskom timu (čl. 15 st. 7).
    statusNadzora: !admin || !v.podlezeNadzoru
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
