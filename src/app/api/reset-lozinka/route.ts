import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifikujResetToken } from "@/lib/passwordReset";
import { rateLimit, klijentIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Anti brute-force tokena: najviše 20 pokušaja po IP-u u 15 min.
    const rl = rateLimit(`reset-primeni:${klijentIP(req)}`, 20, 15 * 60 * 1000);
    if (!rl.ok) {
      return await greska("Previše pokušaja. Pokušajte kasnije.", 429);
    }

    const { token, novaLozinka } = await req.json();

    if (!token || typeof token !== "string") {
      return await greska("Token je obavezan.", 400);
    }
    if (!novaLozinka || typeof novaLozinka !== "string") {
      return await greska("Nova lozinka je obavezna.", 400);
    }
    if (novaLozinka.length < 8) {
      return await greska("Lozinka mora imati najmanje 8 znakova.", 400);
    }

    const verified = await verifikujResetToken(token);
    if (!verified) {
      return await greska("Link je nevažeći ili je istekao.", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: verified.userId } });
    if (!user || user.status !== "ACTIVE") {
      return await greska("Nalog nije dostupan.", 400);
    }

    const passwordHash = await bcrypt.hash(novaLozinka, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: verified.tokenId },
        data: { usedAt: new Date() },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-lozinka] greška:", err);
    return await greska("Interna greška servera.", 500);
  }
}

// GET — proveri da li je token validan (za prikaz forme bez slanja lozinke)
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    const verified = await verifikujResetToken(token);
    return NextResponse.json({ valid: !!verified });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
