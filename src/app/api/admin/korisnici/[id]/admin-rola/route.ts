import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeSuperadmin } from "@/lib/dozvole";
import { AdminNivo } from "@/generated/prisma/client";

// POST — superadmin dodeljuje/oduzima admin rolu (NONE/ADMIN/SUPERADMIN/ZADRUGA).
// ZADRUGA (zadružni admin, zadruge čl. 16; U2) traži `zadrugaId` upisane zadruge;
// svaki drugi nivo briše vezu sa zadrugom.
const DOZVOLJENI: AdminNivo[] = ["NONE", "ADMIN", "SUPERADMIN", "ZADRUGA"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Samo superadmin može menjati admin role.", 403);

  const { id } = await params;
  if (id === session.user.id)
    return await greska("Ne možeš menjati sopstvenu rolu.", 400);

  const body = await req.json().catch(() => ({}));
  const nivo = body.nivo as AdminNivo;
  if (!DOZVOLJENI.includes(nivo))
    return await greska("Neispravan nivo role.", 400);

  let zadrugaId: string | null = null;
  let zadrugaNaziv = "";
  if (nivo === "ZADRUGA") {
    zadrugaId = typeof body.zadrugaId === "string" ? body.zadrugaId : "";
    const z = zadrugaId
      ? await prisma.krug.findUnique({ where: { id: zadrugaId }, select: { zadruga: true, prestanakAt: true, name: true } })
      : null;
    if (!z?.zadruga || z.prestanakAt) return await greska("Izaberi upisanu zadrugu.", 400);
    zadrugaNaziv = z.name;
  }

  const korisnik = await prisma.user.findUnique({
    where: { id },
    select: { pseudonim: true, admin: true, adminZadrugaId: true },
  });
  if (!korisnik) return await greska("Korisnik nije pronađen.", 404);

  if (korisnik.admin === nivo && korisnik.adminZadrugaId === zadrugaId)
    return NextResponse.json({ ok: true, nepromenjeno: true });

  await prisma.user.update({ where: { id }, data: { admin: nivo, adminZadrugaId: zadrugaId } });
  await logAdminAkcija(
    session.user.id,
    "ADMIN_ROLA",
    id,
    `${korisnik.pseudonim}: ${korisnik.admin} → ${nivo}${zadrugaNaziv ? ` (${zadrugaNaziv})` : ""}`
  );

  return NextResponse.json({ ok: true });
}
