import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { azurirajVetoStatus } from "@/lib/protokol/fondacija";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

const KATEGORIJE = ["PLATA", "INFRASTRUKTURA", "PRAVNI_TROSAK", "SOFTWARE", "ADMINISTRATIVNO", "OPERATIVNO", "DRUGO"] as const;
type Kategorija = typeof KATEGORIJE[number];

/**
 * GET /api/admin/fondacija/trosak — sva evidencija troskova (admin)
 * POST /api/admin/fondacija/trosak — evidentira novi trosak
 *   body: { datum: ISO, iznosRSD: number, kategorija: enum, opis: string, dokumentUrl?: string }
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeAdmin(session.user)) return await greska("Samo admin.", 403);

  const troskovi = await prisma.fondacijaTrosak.findMany({
    include: { kreirao: { select: { pseudonim: true } } },
    orderBy: { datum: "desc" },
  });
  return NextResponse.json({
    troskovi: troskovi.map((t) => ({ ...t, iznosRSD: Number(t.iznosRSD) })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!jeAdmin(session.user)) return await greska("Samo admin.", 403);

  const body = await req.json();
  const { datum, iznosRSD, kategorija, opis, dokumentUrl } = body;

  if (!datum || typeof iznosRSD !== "number" || iznosRSD <= 0 || !kategorija || !opis) {
    return await greska("Nedostaju polja ili je iznos neispravan.", 400);
  }
  if (!KATEGORIJE.includes(kategorija as Kategorija)) {
    return await greska("Nepoznata kategorija.", 400);
  }

  const trosak = await prisma.fondacijaTrosak.create({
    data: {
      datum: new Date(datum),
      iznosRSD,
      kategorija: kategorija as Kategorija,
      opis,
      dokumentUrl,
      kreiraoId: session.user.id,
    },
  });

  // Posle svake izmene troskova, azuriraj veto status (mozda saldo Fondacije promenio prag)
  await azurirajVetoStatus();

  await logAdminAkcija(session.user.id, "FONDACIJA_TROSAK_DODAT", trosak.id,
    `${kategorija}: ${iznosRSD} RSD — ${opis}`);

  return NextResponse.json({ trosak: { ...trosak, iznosRSD: Number(trosak.iznosRSD) } });
}
