/**
 * Potvrda elektronske adrese — zajednički tok za punoletan i maloletan nalog.
 *
 * ─── Zašto postoji (R-06) ───────────────────────────────────────────────────
 *
 * Uslovi čl. 9 od prve verzije glase: „Korisnik potvrđuje nalog putem verifikacione
 * poruke na unetoj elektronskoj adresi." Kod to nije radio — registracija nije
 * slala nijednu poruku, a `User` nije imao polje za potvrdu. Akt je propisivao
 * radnju koje nema, isti obrazac koji je registar rizika našao na još pet mesta.
 *
 * Za dokaz pristanka to nije sporedno: zapis pristanka bez potvrđene adrese
 * dokazuje da je NALOG pristao, ne i da je pristalo lice koje tvrdi da je iza
 * njega. Adresa je jedina veza sa čovekom — identitet se nigde ne proverava.
 *
 * ─── 🔴 Potvrda NIJE uslov za rad naloga ────────────────────────────────────
 *
 * Odluka vlasnika (14.09.2026, varijanta „meko"): nalog radi u punom obimu od prve
 * sekunde, i kad se na link nikad ne klikne. Ništa se ne uskraćuje, nijedan
 * korisnik se ne gubi. Ko klikne, dobija `emailPotvrdjenAt`; za ostale se zna da
 * potvrde nema, što je i dalje beskonačno više od ranijeg stanja, u kome se nije
 * znalo ni da je pitanje postavljeno.
 *
 * 🔴 Ne uvoditi uskraćivanje funkcija zbog nepotvrđene adrese bez izričitog naloga
 * — to je bila odbijena varijanta „tvrdo".
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/passwordReset";
import { bazniUrl, emailLayout, esc, posaljiEmailRaw } from "@/lib/email";
import { prevedi } from "@/lib/prevod-servera";

const TOKEN_BYTES = 32;

/** Koliko važi link za potvrdu adrese (isto kao kod naloga deteta). */
export const ROK_POTVRDE_SATI = 24;

export class PotvrdaGreska extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "PotvrdaGreska";
  }
}

/**
 * Šalje poruku dobrodošlice sa linkom za potvrdu adrese, pri otvaranju naloga.
 *
 * Zove se kao `void` — neuspelo slanje ne sme da obori registraciju.
 *
 * 🔴 Ovo je SISTEMSKI mejl i ide preko `posaljiEmailRaw`, ne preko
 * `posaljiEmailKorisniku`: u trenutku slanja korisnik još nije imao priliku da
 * bilo šta podesi, a poruka ne nosi obaveštenje nego potvrdu samog naloga —
 * jednako kao poruka za postavljanje lozinke.
 */
export async function posaljiPotvrduAdrese(userId: string, requestOrigin?: string): Promise<void> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, pseudonim: true, jezik: true, emailPotvrdjenAt: true },
    });
    if (!u?.email || u.emailPotvrdjenAt) return;

    // Jedan živ link po nalogu — isti razlog kao kod naloga deteta.
    await prisma.emailPotvrda.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(TOKEN_BYTES).toString("hex");
    await prisma.emailPotvrda.create({
      data: {
        userId,
        email: u.email,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ROK_POTVRDE_SATI * 60 * 60 * 1000),
      },
    });

    const jezik = u.jezik ?? "sr";
    const link = `${bazniUrl(requestOrigin)}/potvrdi-email/${token}`;
    await posaljiEmailRaw(
      u.email,
      prevedi(jezik, "emailPotvrda.naslov"),
      emailLayout({
        naslov: prevedi(jezik, "emailPotvrda.naslov"),
        pozdrav: u.pseudonim,
        telo: [
          prevedi(jezik, "emailPotvrda.telo1", { pseudonim: esc(u.pseudonim) }),
          prevedi(jezik, "emailPotvrda.telo2"),
          prevedi(jezik, "emailPotvrda.telo3", { sati: ROK_POTVRDE_SATI }),
          prevedi(jezik, "emailPotvrda.telo4"),
        ],
        dugme: { tekst: prevedi(jezik, "emailPotvrda.dugme"), link },
        jezik,
      }),
    );
  } catch {
    /* potvrda adrese nije kritična — nalog radi i bez nje */
  }
}

/**
 * Potvrđuje adresu linkom iz poruke. Radi za OBA slučaja, i razlika je bitna:
 *
 *  - **maloletan nalog** je adresu tek prijavio i ona se upisuje TEK OVDE
 *    (`dete-email.ts`), uz `emailObavestenja: false` — adresa je data radi povratka
 *    u nalog, ne radi pošte;
 *  - **punoletan nalog** adresu već ima od registracije, pa se upisuje samo
 *    `emailPotvrdjenAt` i ništa drugo se ne dira — naročito ne `emailObavestenja`,
 *    koja su mu podrazumevano uključena i nisu predmet ove potvrde.
 */
export async function potvrdiAdresu(token: unknown): Promise<{ pseudonim: string; email: string }> {
  if (typeof token !== "string" || token.length < 32) {
    throw new PotvrdaGreska("Link nije važeći.", 400);
  }
  const zapis = await prisma.emailPotvrda.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      email: true,
      usedAt: true,
      expiresAt: true,
      user: { select: { id: true, pseudonim: true, maloletan: true, deaktiviranAt: true } },
    },
  });
  if (!zapis || zapis.usedAt || zapis.expiresAt < new Date()) {
    throw new PotvrdaGreska("Link nije važeći ili je istekao. Upiši adresu ponovo.", 400);
  }
  if (zapis.user.deaktiviranAt) throw new PotvrdaGreska("Link nije važeći.", 400);

  const zauzeta = await prisma.user.findUnique({
    where: { email: zapis.email },
    select: { id: true },
  });
  if (zauzeta && zauzeta.id !== zapis.user.id) {
    throw new PotvrdaGreska("Ta adresa se u međuvremenu upisala na drugi nalog.", 409);
  }

  const maloletan = zapis.user.maloletan;

  await prisma.$transaction(async (tx) => {
    // Rezerviši token pre upisa: dva klika na isti link ne smeju da prođu oba.
    const uzeto = await tx.emailPotvrda.updateMany({
      where: { id: zapis.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (uzeto.count === 0) throw new PotvrdaGreska("Link je već upotrebljen.", 409);

    await tx.user.update({
      where: { id: zapis.user.id },
      data: maloletan
        ? { email: zapis.email, emailObavestenja: false, emailPotvrdjenAt: new Date() }
        : { emailPotvrdjenAt: new Date() },
    });
  });

  return { pseudonim: zapis.user.pseudonim, email: zapis.email };
}
