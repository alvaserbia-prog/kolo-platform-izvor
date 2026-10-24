import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";
import { kreirajResetToken, posaljiResetEmail } from "@/lib/passwordReset";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { rateLimit, klijentIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Anti-flood: najviše 5 zahteva za reset po IP-u u 15 min (sprečava spam mejlova).
    const rl = rateLimit(`reset-zahtev:${klijentIP(req)}`, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ ok: true }); // tih odgovor (ne otkrivamo throttling)
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return await greska("Unesite ispravnu email adresu.", 400);
    }

    const trazeniEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: trazeniEmail } });

    // Iz bezbednosnih razloga uvek vraćamo isti odgovor — ne otkrivamo da li email postoji.
    // Email se šalje za svaki aktivan nalog, bez obzira da li ima lozinku.
    // OAuth-only nalozi dobijaju email sa drugačijim tekstom — "Postavi lozinku" umesto "Resetovanje lozinke".
    if (user && user.status === "ACTIVE") {
      try {
        const token = await kreirajResetToken(user.id);
        const imaLozinku = !!user.passwordHash;
        const origin = new URL(req.url).origin;
        await posaljiResetEmail(user.email!, token, user.pseudonim, imaLozinku, origin, user.jezik);
      } catch (err) {
        console.error("[zaboravljena-lozinka] greška pri slanju:", err);
      }
    } else {
      // Debug alert — javlja zašto email NIJE poslat (nalog ne postoji ili nije aktivan)
      void posaljiAdminAlert(
        "Reset lozinke — nalog NIJE pronađen",
        `Trazeni email: ${trazeniEmail}\nNalog postoji: ${!!user}\nStatus: ${user?.status ?? "n/a"}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return await greska("Interna greška servera.", 500);
  }
}
