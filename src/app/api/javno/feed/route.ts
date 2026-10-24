import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dnevniPregledPrograma } from "@/lib/protokol/programi";
import { uslovZapisaProtokola, opisZapisaProtokola, VEZA_PROGRAMA } from "@/lib/protokol/program-prikaz";
import { BEZ_DECE } from "@/lib/protokol/deca";

/**
 * GET /api/javno/feed — gradirana vidljivost (Politika privatnosti čl. 6):
 *  - gost (neprijavljen): samo agregat (ukupan broj), BEZ pojedinačnih transakcija
 *  - prijavljen neverifikovan: iznosi/vreme/tip, ali strane su MASKIRANE (bez pseudonima)
 *  - verifikovan (indeks ≥ 10%): pun feed sa pseudonimima strana
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const prijavljen = !!session;
  const verifikovan = !!session?.user?.verified;

  const ukupno = await prisma.transaction.count();

  // Gost vidi samo agregat — pojedinačne transakcije se ne izlažu neprijavljenima.
  //
  // 🔴 Dnevni zbir po programu ide i njemu: čl. 4 st. 4 Pravilnika o programima
  // podrške kaže da se „neprijavljenim licima i korisnicima čija stvarnost nije
  // potvrđena prikazuje isključivo dnevni zbir po programu". Do seta 4.6.7 je
  // gostu izostajao i on, pa je proverljivost evidencije za njega bila prazna.
  if (!prijavljen) {
    return NextResponse.json({
      ukupno,
      nivo: "gost",
      programi: await dnevniPregledPrograma(),
      transakcije: [],
    });
  }

  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
  const take = 50;

  // Transakcije u kojima je bilo koja strana maloletna se NE prikazuju — ni
  // verifikovanom posmatraču, kome bi feed inače otkrio pseudonim deteta
  // (Modul Deca, čl. 13; dečji prostor nije javan).
  // Zapis Protokola i zapis Kruga nemaju korisnika — njih uslov mora da propusti,
  // inače bi svaka emisija ispala iz feeda.
  const transakcije = await prisma.transaction.findMany({
    where: {
      AND: [
        { OR: [{ fromWalletId: null }, { fromWallet: { is: BEZ_DECE } }] },
        { toWallet: { is: BEZ_DECE } },
        // 🔴 Zapis socijalnog programa izlazi pojedinačno SAMO verifikovanom
        // posmatraču (čl. 4 st. 4, set 4.6.7), i uslov za to stoji na jednom
        // mestu — `uslovZapisaProtokola`. Isti koriste `/sistem` i
        // `/api/pocetna/liste`; prepisan, razišao bi se pri prvoj izmeni.
        //
        // 🔴 Iznos je kod dva programa invertibilan: `izracunajStariji` daje
        // 1000 + 100 × (godine − 50), pa 2.500 POEN znači tačno 65 godina, a
        // `izracunajMajke` iz jednog broja odaje koliko dece korisnica ima i
        // koliko je svako staro. To se ovim setom PRIHVATA za verifikovanog
        // posmatraču: pristanak iz čl. 4 st. 3 izričito navodi šta se iz iznosa
        // može izvesti. Nepotvrđenom članu i gostu ostaje dnevni zbir.
        //
        // 🔴 Osnov po kome je pravo ostvareno se ne prikazuje NIKOME (st. 5) —
        // `VEZA_PROGRAMA` zato dovlači samo tip programa.
        uslovZapisaProtokola(verifikovan),
      ],
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take,
    include: {
      ...VEZA_PROGRAMA,
      fromWallet: { include: { user: { select: { pseudonim: true } }, krug: { select: { name: true } } } },
      toWallet: { include: { user: { select: { pseudonim: true } }, krug: { select: { name: true } } } },
    },
  });

  // Pseudonim korisnika vidljiv je samo verifikovanima; neverifikovanom se strana
  // koja je korisnik prikazuje kao neutralno „Korisnik" (Krug/Protokol nisu pseudonimi).
  function walletLabel(w: { user?: { pseudonim: string } | null; krug?: { name: string } | null } | null) {
    if (!w) return "Protokol";
    if (w.user) return verifikovan ? w.user.pseudonim : "Korisnik";
    if (w.krug) return `[${w.krug.name}]`;
    return "Protokol";
  }

  return NextResponse.json({
    ukupno,
    nivo: verifikovan ? "verifikovan" : "neverifikovan",
    // Socijalni programi: dnevni zbir po programu umesto pojedinačnih redova.
    programi: await dnevniPregledPrograma(),
    transakcije: transakcije.map((t) => ({
      id: t.id,
      from: walletLabel(t.fromWallet),
      to: walletLabel(t.toWallet),
      amount: t.amount,
      type: t.type,
      // Opis ide uz zapise Protokola, ne uz ažuriranja evidencije između korisnika.
      //
      // 🔴 Uslov je bio `t.fromWallet === null`, a `emitujPoen` UVEK upisuje
      // `fromWalletId = "banka-singleton"` — pa je za svaku emisiju ispadalo
      // `null` i opis nije izlazio nijedan. Zapis Protokola se prepoznaje po tome
      // što na izlaznoj strani NEMA korisnika, ne po tome što strane nema.
      //
      // Naziv socijalnog programa se sklapa pri čitanju, iz prijave, i samo za
      // verifikovanog — u samom zapisu stoji opšta oznaka „Socijalni program".
      description: t.fromWallet?.user ? null : opisZapisaProtokola(null, t, verifikovan),
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
