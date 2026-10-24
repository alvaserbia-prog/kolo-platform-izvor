import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { WalletType } from "@/generated/prisma/client";
import { normalizujEmail, validanEmail, validanPseudonim, PSEUDONIM_PRAVILO } from "@/lib/validacija";
import { razresiNaselje, PORUKA_MESTO_IZ_SPISKA } from "@/lib/naselje";
import { poljaPseudonima, porukaZauzeca, proveriZauzece } from "@/lib/pseudonim";
import { rateLimit, klijentIP } from "@/lib/rate-limit";
import { obavestiAdmineNoviKorisnik } from "@/lib/notifikacije";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { getLocale } from "next-intl/server";
import { oba, PORUKA_PRISTANAK_OBAVEZAN, upisiPristankeRegistracije } from "@/lib/protokol/pristanak";
import { posaljiPotvrduAdrese } from "@/lib/protokol/potvrda-adrese";

function generateMemberHash(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let hash = "";
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export async function POST(req: NextRequest) {
  try {
    // Rate-limit: najviše 10 registracija po IP-u na sat (anti-spam).
    const rl = rateLimit(`registracija:${klijentIP(req)}`, 10, 60 * 60 * 1000);
    if (!rl.ok) {
      return await greska("Previše pokušaja. Pokušajte kasnije.", 429);
    }

    const body = await req.json();
    const { email, pseudonim, password } = body;
    const location = typeof body.location === "string" ? body.location.trim() : null;

    // Validacija — striktne provere tipova (bez biblioteke): array/objekat sa `.length`
    // ne sme da prođe kao string.
    if (typeof email !== "string" || typeof pseudonim !== "string" || typeof password !== "string") {
      return await greska("Sva obavezna polja moraju biti popunjena.", 400);
    }
    if (!validanEmail(email)) {
      return await greska("Unesite ispravnu email adresu.", 400);
    }
    if (password.length < 8 || password.length > 200) {
      return await greska("Lozinka mora imati između 8 i 200 znakova.", 400);
    }
    if (!validanPseudonim(pseudonim)) {
      return await greska(PSEUDONIM_PRAVILO, 400);
    }
    if (location !== null && location.length > 80) {
      return await greska("Mesto je predugačko.", 400);
    }
    // 🔴 Pristanak se proverava NA SERVERU (R-06). Do seta 4.6.3 su dve kvačice
    // živele samo u pretraživaču (`canSubmit`), pa je nalog nastajao i bez ijedne
    // — dovoljno je bilo zaobići obrazac. Time nije nedostajao samo dokaz
    // pristanka (ZZPL čl. 15 st. 1) nego i dokaz da je ugovor zaključen, a
    // „izvršenje ugovornog odnosa" je osnov za većinu obrada iz Politike čl. 4.
    if (!oba(body.prihvatamUslove, body.prihvatamPolitiku)) {
      return await greska(PORUKA_PRISTANAK_OBAVEZAN, 400);
    }
    // Mesto je opciono, ali kad se navede mora biti JEDNO naselje iz šifarnika —
    // slobodan tekst („Stanišić (Sombor)") se ne poklapa ni sa filterom po mestu
    // ni sa koordinatama za udaljenost. Upisuje se kanonski naziv.
    let mesto: string | null = null;
    if (location) {
      mesto = razresiNaselje(location);
      if (!mesto) return await greska(PORUKA_MESTO_IZ_SPISKA, 400);
    }

    const emailNorm = normalizujEmail(email);
    const pseudonimClean = pseudonim.trim();

    // Provera jedinstvenosti (email i pseudonim u kanonskoj formi — bez duplikata
    // zbog velikih slova; pseudonim se proverava i protiv napuštenih imena)
    const [existingEmail, zauzece] = await Promise.all([
      prisma.user.findUnique({ where: { email: emailNorm } }),
      proveriZauzece(pseudonimClean),
    ]);
    if (existingEmail) {
      return await greska("Email je već registrovan.", 409);
    }
    if (zauzece) {
      return await greska(porukaZauzeca(zauzece), 409);
    }

    // Generiši jedinstven member hash
    let myHash = generateMemberHash();
    while (await prisma.user.findUnique({ where: { memberHash: myHash } })) {
      myHash = generateMemberHash();
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const jezik = await getLocale();

    // Kreira korisnika + wallet + ZAPIS PRISTANKA — sve u jednoj transakciji.
    //
    // 🔴 Pristanak ne sme da se upisuje posle: nalog bez zapisa pristanka je
    // tačno stanje koje R-06 uklanja, a pad između dva upisa vratio bi ga tiho,
    // jer bi korisnik i dalje dobio uspešan odgovor.
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: emailNorm,
          passwordHash,
          ...poljaPseudonima(pseudonimClean),
          memberHash: myHash,
          location: mesto,
          jezik,
          wallet: {
            create: { type: WalletType.USER, balance: 0 },
          },
        },
      });
      await upisiPristankeRegistracije(tx, u.id, jezik, "registracija");
      return u;
    });

    // Potvrda adrese (Uslovi čl. 9). 🔴 NIJE uslov za rad naloga — nalog radi u
    // punom obimu i bez klika, pa neuspelo slanje ne sme da obori registraciju.
    void posaljiPotvrduAdrese(user.id, req.nextUrl.origin);

    // Obavesti admine o novom nalogu (ne sme da obori registraciju ako zakaže):
    //  - in-app bell za sve admine,
    //  - Telegram bot + email (stiže na telefon/Windows).
    try {
      await obavestiAdmineNoviKorisnik(user.id, user.pseudonim);
    } catch {
      /* notifikacija nije kritična */
    }
    void posaljiAdminAlert(
      "Nov korisnik se priključio",
      `Pseudonim: ${user.pseudonim}\nNačin: registracija (email)\nVerifikovan: ne`,
    );

    return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
  } catch {
    return await greska("Interna greška servera.", 500);
  }
}
