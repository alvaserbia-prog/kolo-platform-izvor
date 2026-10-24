/**
 * POST /api/verifikacija/prijavi
 *
 * Verifikovani korisnik prijavljuje da je verifikovan od osobe koju ne poznaje
 * (npr. posle verifikacije sa table jemstva). Ne preduzima automatsku radnju —
 * upisuje RizikNalaz (OTVOREN) koji superadmin vidi u Nadzoru integriteta i
 * šalje admin alert. Korektiv je čovek, u skladu sa principom nadzora (sistem
 * samo evidentira i javlja).
 *
 * Body: { razlog?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { rateLimit } from "@/lib/rate-limit";

const MAX_RAZLOG = 500;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const rl = rateLimit(`prijava-verifikacije:${session.user.id}`, 5, 60 * 60_000);
  if (!rl.ok) {
    return await greska("Previše prijava. Pokušaj kasnije.", 429);
  }

  const body = await req.json().catch(() => ({}));
  const razlog = typeof body.razlog === "string" ? body.razlog.trim().slice(0, MAX_RAZLOG) : "";

  // Učitaj verifikatore koji su verifikovali ovog korisnika — kontekst za nadzor.
  const veze = await prisma.verifikacionaVeza.findMany({
    where: { verifikovaniId: session.user.id },
    orderBy: { vremenskiZig: "desc" },
    select: { verifikator: { select: { pseudonim: true } } },
    take: 10,
  });
  const verifikatori = veze.map((v) => v.verifikator.pseudonim).join(", ") || "—";

  const opis = razlog
    ? `Prijava verifikacije: ${razlog}`
    : "Korisnik prijavljuje da je verifikovan od osobe koju ne poznaje.";

  await prisma.rizikNalaz.create({
    data: {
      tip: "NALOG",
      subjektId: session.user.id,
      pseudonim: session.user.pseudonim,
      pravila: JSON.stringify([
        { kod: "PRIJAVA_VERIFIKACIJE", nivo: "UPOZORENJE", opis },
      ]),
      rizik: 30,
      nivo: "UPOZORENJE",
      status: "OTVOREN",
    },
  });

  void posaljiAdminAlert(
    "Prijava verifikacije",
    `Korisnik: ${session.user.pseudonim}\nVerifikatori: ${verifikatori}\n${opis}`
  );

  return NextResponse.json({ ok: true });
}
