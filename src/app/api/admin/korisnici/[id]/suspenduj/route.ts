import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeSuperadmin } from "@/lib/dozvole";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const razlog = (body.razlog ?? "").trim();

  const korisnik = await prisma.user.findUnique({ where: { id }, select: { tipKorisnika: true, admin: true, status: true, pseudonim: true } });
  if (!korisnik) return await greska("Korisnik nije pronađen.", 404);
  if (jeSuperadmin(korisnik)) return await greska("Ne može se suspendovati admin.", 400);
  if (korisnik.status === "SUSPENDED") return await greska("Korisnik je već suspendovan.", 400);

  await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: razlog || null },
  });

  await logAdminAkcija(session.user.id, "KORISNIK_SUSPENDOVAN", id, `${korisnik.pseudonim}${razlog ? ": " + razlog : ""}`);

  return NextResponse.json({ ok: true });
}
