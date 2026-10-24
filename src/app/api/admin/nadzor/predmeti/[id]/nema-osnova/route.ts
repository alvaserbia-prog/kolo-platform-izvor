/**
 * POST /api/admin/nadzor/predmeti/[id]/nema-osnova
 *
 * Upravni odbor zatvara nadzorni predmet nalazom da za sumnju nema osnova
 * (Pravilnik o dokazu stvarnosti 4.2.0, čl. 11a st. 4).
 *
 * Verifikacija, odnosno potvrda (člana bez potvrde ili postojanja deteta), ostaje na snazi. Predmet se briše po isteku 90 dana od zatvaranja
 * (cron `/api/cron/nadzor-predmeti-cistenje`) — sumnja koja se nije potvrdila ne
 * sme da ostane kao trajna beleška o čoveku.
 *
 * Zapis ostaje na spisku za nadzor dok neki nadzornik ne upiše „uredno".
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;

  let body: { beleska?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* beleška je opciona */
  }
  const beleska = typeof body.beleska === "string" ? body.beleska.trim() || null : null;

  const predmet = await prisma.nadzorniPredmet.findUnique({
    where: { id },
    include: {
      verifikacija: {
        select: {
          verifikator: { select: { pseudonim: true } },
          verifikovani: { select: { pseudonim: true } },
        },
      },
      potvrdaClana: {
        select: { potvrdio: { select: { pseudonim: true } }, potvrdjeni: { select: { pseudonim: true } } },
      },
      potvrdaPostojanja: {
        select: { potvrdio: { select: { pseudonim: true } }, roditelj: { select: { pseudonim: true } } },
      },
    },
  });
  if (!predmet) return await greska("Predmet nije pronađen.", 404);
  if (predmet.status !== "OTVOREN") return await greska("Predmet nije otvoren.", 400);

  await prisma.nadzorniPredmet.update({
    where: { id },
    data: {
      status: "NEMA_OSNOVA",
      resenById: session.user.id,
      resenAt: new Date(),
      beleska,
    },
  });

  await logAdminAkcija(
    session.user.id,
    "NADZORNI_PREDMET_NEMA_OSNOVA",
    id,
    (predmet.verifikacija
      ? `verifikacija ${predmet.verifikacija.verifikator.pseudonim} → ${predmet.verifikacija.verifikovani.pseudonim}`
      : predmet.potvrdaClana
        ? `potvrda člana ${predmet.potvrdaClana.potvrdio?.pseudonim ?? "lanac"} → ${predmet.potvrdaClana.potvrdjeni.pseudonim}`
        : predmet.potvrdaPostojanja
          ? `potvrda postojanja deteta ${predmet.potvrdaPostojanja.potvrdio?.pseudonim ?? "—"} → ${predmet.potvrdaPostojanja.roditelj.pseudonim}`
          : "") +
      (beleska ? ` — ${beleska}` : "")
  );

  return NextResponse.json({ ok: true });
}
