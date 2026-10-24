import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { greska } from "@/lib/greska-api";
import { sesija } from "@/lib/sesija";
import { prisma } from "@/lib/prisma";
import { nivoZaKumulativ } from "@/lib/protokol/donacija";
import { BEZ_DECE } from "@/lib/protokol/deca";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { uslovZapisaProtokola, opisZapisaProtokola, VEZA_PROGRAMA } from "@/lib/protokol/program-prikaz";

/**
 * Spiskovi ispod kartica na početnoj — članovi, razmene, zapisi Protokola.
 *
 * Zašto ruta a ne SSR: početna je prvi ekran posle prijave i otvara je svako, a
 * spisak članova nosi upit nad SVIM nalozima sa njihovim donacijama. Kartica se
 * otvara klikom, pa se i podaci dižu tek tada — zatvorena kartica ne sme da
 * košta nijedan upit.
 *
 * 🔴 Upiti su ISTI kao na `/sistem` (isti `USLOV_RAZMENE`, isti `BEZ_DECE`,
 * ista podela na zapise Protokola i prepise između korisnika). Dve kartice sa
 * istim imenom ne smeju da mere dva različita skupa.
 *
 * 🔴 Vidljivost se sprovodi OVDE, ne samo u prikazu. Pseudonim u evidenciji
 * doprinosa vidi samo potvrđen član (Pravilnik čl. 67, Politika čl. 6), pa se
 * novom članu strane maskiraju na serveru (`null`), a spisak članova mu se ne
 * šalje uopšte. Na `/sistem` tu razliku pravi tek prikaz — ovde pseudonim ne
 * stigne ni u mrežni odgovor.
 */

/** Koliko zapisa ide u spisak ispod kartice. */
const KOLIKO_ZAPISA = 50;

export async function GET(req: Request) {
  const session = await sesija();
  if (!session) return await greska("Unauthorized", 401);

  const sekcija = new URL(req.url).searchParams.get("sekcija");
  const verified = session.user.verified;

  // Dete ima svoju početnu (`DecjaPocetna`) i do ovih spiskova ne dolazi; ako
  // ipak dođe, dečji prostor nije javan — isto kao da nije potvrđen član.
  if (sekcija === "clanovi") {
    if (!verified) return NextResponse.json({ clanovi: [] });
    const korisnici = await prisma.user.findMany({
      where: { oauthPending: false, deaktiviranAt: null, status: "ACTIVE" },
      orderBy: [{ wallet: { balance: "desc" } }],
      select: {
        id: true,
        pseudonim: true,
        verified: true,
        avatar: true,
        location: true,
        createdAt: true,
        maloletan: true,
        wallet: { select: { balance: true } },
        krugClanstva: {
          where: { leftAt: null },
          select: { krug: { select: { name: true } } },
          take: 1,
        },
        donations: { where: { status: "CONFIRMED" }, select: { amountRSD: true } },
      },
    });

    return NextResponse.json({
      clanovi: korisnici.map((u) => {
        const donacijeRSD = u.donations.reduce((s, d) => s + Number(d.amountRSD), 0);
        return {
          id: u.id,
          pseudonim: u.pseudonim,
          verified: u.verified,
          maloletan: u.maloletan,
          avatar: u.avatar,
          balance: u.wallet?.balance ?? 0,
          krug: u.krugClanstva[0]?.krug?.name ?? null,
          donacijeRSD,
          rangDonacije: donacijeRSD > 0 ? nivoZaKumulativ(donacijeRSD).nivo : 0,
          location: u.location ?? null,
          createdAt: u.createdAt.toISOString(),
        };
      }),
    });
  }

  if (sekcija !== "razmene" && sekcija !== "protokol") {
    return await greska("Nepoznata sekcija.", 400);
  }

  // Dečji prostor izlazi iz oba spiska (Pravilnik o učešću dece čl. 13) — uslov
  // je onaj isti iz `protokol/deca.ts`, ne njegova kopija.
  const bezDece = [
    { OR: [{ fromWalletId: null }, { fromWallet: { is: BEZ_DECE } }] },
    { toWallet: { is: BEZ_DECE } },
  ];

  const zapisi = await prisma.transaction.findMany({
    where:
      sekcija === "razmene"
        ? { ...USLOV_RAZMENE, AND: bezDece }
        : {
            // Zapisi Protokola = sve što nije prepis između korisnika.
            // 🔴 Zapis socijalnog programa ulazi samo verifikovanom posmatraču
            // (Pravilnik o programima podrške čl. 4 st. 4, set 4.6.7). Uslov je
            // ISTI onaj koji koriste `/sistem` i `/api/javno/feed`, ne njegova
            // kopija — razlaz dva takva upita je već jednom proizveo kvar.
            // Osnov po kome je pravo ostvareno se ne prikazuje nikome (st. 5).
            ...uslovZapisaProtokola(verified),
            AND: bezDece,
          },
    orderBy: { createdAt: "desc" },
    take: KOLIKO_ZAPISA,
    include: {
      ...VEZA_PROGRAMA,
      fromWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
      toWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
    },
  });

  /**
   * Strana u zapisu. Zapis Protokola nema korisnika i njegovo ime se NE krije —
   * bez njega bi red glasio „— → —". Korisnik se novom članu ne imenuje.
   */
  const strana = (korisnik: { id: string; pseudonim: string } | null | undefined) => {
    if (!korisnik) return { id: null, pseudonim: "Protokol" };
    if (!verified) return { id: null, pseudonim: null };
    return { id: korisnik.id, pseudonim: korisnik.pseudonim };
  };

  const locale = await getLocale();
  return NextResponse.json({
    stavke: zapisi.map((t) => {
      const od = strana(t.fromWallet?.user);
      const ka = strana(t.toWallet?.user);
      return {
        id: t.id,
        amount: t.amount,
        type: t.type,
        // Naziv socijalnog programa se sklapa pri čitanju, za verifikovanog.
        description: opisZapisaProtokola(locale, t, verified),
        createdAt: t.createdAt.toISOString(),
        fromPseudonim: od.pseudonim,
        fromId: od.id,
        toPseudonim: ka.pseudonim,
        toId: ka.id,
      };
    }),
  });
}
