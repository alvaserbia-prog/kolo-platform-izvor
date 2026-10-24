import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions, uniqueMemberHash } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizujEmail, validanPseudonim, PSEUDONIM_PRAVILO } from "@/lib/validacija";
import { poljaPseudonima, porukaZauzeca, proveriZauzece } from "@/lib/pseudonim";
import { WalletType } from "@/generated/prisma/client";
import { obavestiAdmineNoviKorisnik } from "@/lib/notifikacije";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { getLocale } from "next-intl/server";
import { oba, PORUKA_PRISTANAK_OBAVEZAN, upisiPristankeRegistracije } from "@/lib/protokol/pristanak";
import { posaljiPotvrduAdrese } from "@/lib/protokol/potvrda-adrese";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Pristup samo nedovršenoj OAuth registraciji.
  if (!session?.user?.oauthPending) {
    return await greska("Nalog je već podešen.", 400);
  }

  const body = await req.json();
  const { pseudonim } = body;

  if (!validanPseudonim(pseudonim)) {
    return await greska(PSEUDONIM_PRAVILO, 400);
  }
  // 🔴 Isti uslov kao pri registraciji (R-06): kvačice na ovom obrascu žive samo u
  // pretraživaču, pa server mora da ih traži sam. OAuth put nije izuzetak — ugovor
  // se ovde zaključuje isto kao i na drugom ulazu.
  if (!oba(body.prihvatamUslove, body.prihvatamPolitiku)) {
    return await greska(PORUKA_PRISTANAK_OBAVEZAN, 400);
  }
  const trimmed = pseudonim.trim();
  const jezik = await getLocale();

  // Nalog se ovde tek dobija pseudonim (nije preimenovanje), pa se izuzima sopstveni
  // red — placeholder koji je eventualno stajao u njemu ne ide u istoriju napuštenih.
  const zauzece = await proveriZauzece(trimmed, session.user.id);
  if (zauzece) {
    return await greska(porukaZauzeca(zauzece), 409);
  }

  // Legacy slučaj: red već postoji u bazi (stari tok ili napola dovršen nalog) — ažuriraj ga.
  if (session.user.id) {
    const id = session.user.id;
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { ...poljaPseudonima(trimmed), oauthPending: false, jezik },
      });
      await upisiPristankeRegistracije(tx, id, jezik, "oauth");
    });
    return NextResponse.json({ ok: true, userId: id });
  }

  // Novi tok: nalog se kreira tek sada (do ovog koraka ničega nije bilo u bazi).
  const email = normalizujEmail(session.user.pendingEmail);
  if (!email) {
    return await greska("Nedostaju podaci o nalogu. Prijavite se ponovo.", 400);
  }

  // Idempotentno: ako je nalog s ovim email-om u međuvremenu nastao (dupli submit),
  // ne pravi duplikat — samo dovrši postojeći.
  const postojeci = await prisma.user.findUnique({ where: { email } });
  if (postojeci) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: postojeci.id },
        data: { ...poljaPseudonima(trimmed), oauthPending: false, jezik },
      });
      await upisiPristankeRegistracije(tx, postojeci.id, jezik, "oauth");
    });
    return NextResponse.json({ ok: true, userId: postojeci.id });
  }

  const memberHash = await uniqueMemberHash();
  const created = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email,
        passwordHash: undefined,
        ...poljaPseudonima(trimmed),
        oauthProvider: session.user.pendingProvider,
        oauthId: session.user.pendingOauthId,
        oauthPending: false,
        memberHash,
        avatar: session.user.pendingAvatar ?? undefined,
        jezik,
        wallet: { create: { type: WalletType.USER, balance: 0 } },
      },
    });
    if (session.user.pendingPunoIme) {
      await tx.userPodaci.create({
        data: { userId: u.id, punoIme: session.user.pendingPunoIme },
      });
    }
    await upisiPristankeRegistracije(tx, u.id, jezik, "oauth");
    return u;
  });

  // Obavesti admine o novom nalogu (in-app bell + Telegram/email; telefon/Windows).
  try {
    await obavestiAdmineNoviKorisnik(created.id, trimmed);
  } catch {
    /* notifikacija nije kritična */
  }
  void posaljiAdminAlert(
    "Nov korisnik se priključio",
    `Pseudonim: ${trimmed}\nNačin: ${session.user.pendingProvider ?? "OAuth"}\nVerifikovan: ne`,
  );
  void posaljiPotvrduAdrese(created.id, req.nextUrl.origin);

  return NextResponse.json({ ok: true, userId: created.id });
}
