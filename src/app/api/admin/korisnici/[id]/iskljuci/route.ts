import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { iskljuciKorisnika } from "@/lib/protokol/iskljucenje";

// POST — isključi korisnika (Čl. 33): EXCLUDED status, izlaz iz krugovi
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const razlog = (body.razlog ?? "").trim();

  const korisnik = await prisma.user.findUnique({
    where: { id },
    select: { tipKorisnika: true, admin: true, status: true, pseudonim: true },
  });
  if (!korisnik) return await greska("Korisnik nije pronađen.", 404);
  if (jeSuperadmin(korisnik)) return await greska("Ne može se isključiti admin.", 400);
  if (korisnik.status === "EXCLUDED") return await greska("Korisnik je već isključen.", 400);

  await iskljuciKorisnika(session.user.id, id, razlog);
  return NextResponse.json({ ok: true });
}
