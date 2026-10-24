import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evidentirajDoprinos } from "@/lib/protokol/pokrovitelj";
import { jeAdmin } from "@/lib/dozvole";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";

// Gornja granica jednog evidentiranog doprinosa (RSD) — odbrana od slučajnog upisa
// ogromnog iznosa koji bi emitovao bonus POEN bez pokrića.
const MAX_RSD_DOPRINOS = 1_000_000_000;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nemate pristup.", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { rsdIznos, tip, napomena } = body;

  if (!rsdIznos || typeof rsdIznos !== "number" || !Number.isFinite(rsdIznos) || rsdIznos <= 0) {
    return await greska("Neispravan iznos.", 400);
  }
  if (rsdIznos > MAX_RSD_DOPRINOS) {
    return await greska("Iznos je neuobičajeno velik.", 400);
  }
  // 🔴 U kumulativ i nivo ulazi SAMO novac (donacije čl. 13h st. 3, O-6). Dobra i
  // usluge idu kroz pokroviteljstvo dobrima i uslugama (Glava IVa), koje kumulativ
  // ne dira.
  if (tip !== "NOVAC") {
    return await greska("Neispravan tip doprinosa.", 400);
  }

  // Anti dupli-klik: odbij identičan doprinos (isti iznos/tip/napomena) u poslednjih 15s.
  const skoro = await prisma.pokroviteljDoprinos.findFirst({
    where: {
      pokroviteljId: id,
      rsdIznos: rsdIznos,
      tip,
      napomena: napomena ?? null,
      createdAt: { gt: new Date(Date.now() - 15_000) },
    },
    select: { id: true },
  });
  if (skoro) {
    return await greska("Isti doprinos je upravo evidentiran (mogući dupli klik).", 409);
  }

  const rezultat = await evidentirajDoprinos({
    pokroviteljId: id,
    rsdIznos: rsdIznos,
    tip,
    evidentiraoId: session.user.id,
    napomena,
  });

  await logAdminAkcija(session.user.id, "POKROVITELJ_DOPRINOS_EVIDENTIRAN", id,
    `${tip} ${rsdIznos} RSD${napomena ? " — " + napomena : ""}`);

  return NextResponse.json({
    ok: true,
    noviNivoi: rezultat.noviNivoi.map((n) => ({ nivo: n.nivo, bonusPoen: n.bonusPoen })),
  });
}
