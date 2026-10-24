/**
 * POST /api/admin/sistemsko-obavestenje/[id]/posalji
 *
 * Pokreni ili NASTAVI slanje. Jedan poziv obradi koliko stigne u budžetu vremena
 * i vrati napredak; klijent poziva ponovo dok `zavrseno` ne bude `true`. Kursor
 * u bazi znači da nastavak ne šalje istom korisniku dvaput, pa je ponovni poziv
 * bezbedan i posle zatvaranja pregledača.
 *
 * SAMO SUPERADMIN.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { posaljiSledecuPorciju } from "@/lib/sistemsko-obavestenje";

// Slanje traje duže od podrazumevanog limita — tražimo pun raspoloživi prozor.
export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const { id } = await params;

  const pre = await prisma.sistemskoObavestenje.findUnique({
    where: { id },
    select: { status: true, naslov: true, pravniOsnov: true },
  });
  if (!pre) return await greska("Obaveštenje ne postoji.", 404);

  // Loguj samo stvarno pokretanje, ne i svaki nastavak — inače bi jedan krug
  // slanja zatrpao audit log sa desetinama identičnih redova.
  if (pre.status === "NACRT") {
    await logAdminAkcija(
      session.user.id,
      "SISTEMSKO_OBAVESTENJE_POSLATO",
      id,
      `Naslov: ${pre.naslov} | Osnov: ${pre.pravniOsnov}`
    );
  }

  try {
    const napredak = await posaljiSledecuPorciju(id);
    return NextResponse.json(napredak);
  } catch (e) {
    console.error("[POST /api/admin/sistemsko-obavestenje/[id]/posalji]", e);
    return await greska("Greška pri slanju.", 500);
  }
}
