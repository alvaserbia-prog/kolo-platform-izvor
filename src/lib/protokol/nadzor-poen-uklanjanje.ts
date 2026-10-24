/**
 * Poništenje POEN-a za nadzor — prelazna radnja uz set 4.7.5, ispravljena setom 4.7.7.
 *
 * Odluka vlasnika 18.10.2026: nadzor se više ne plaća (dokaz stvarnosti čl. 7 i 10),
 * a zatečeni upisi se poništavaju. Osnov: dokaz stvarnosti čl. 22b i Pravilnik o KOLO
 * sistemu čl. 14 (poslednji stav).
 *
 * 🔴 ŠTA SE PONIŠTAVA — samo ŽIVIH 500, a ne svaki red `EMISIJA_NADZOR` u istoriji.
 * Živ je onaj upis čija veza još postoji i nosi `nadzorPoenStatus = EVIDENTIRAN`. Upis
 * koji je već poništen (lažna potvrda, gašenje naloga, prevođenje u maloletni nalog)
 * više nema živu vezu: svi ti tokovi vezu BRIŠU. Prva verzija ove radnje uzimala je sve
 * redove `EMISIJA_NADZOR` i takvom nadzorniku skidala 500 po drugi put. Stari upisi
 * nemaju `nadzorTxId`, pa se ne uparuje po redu nego BROJI po nadzorniku: broj živih
 * veza × 500, uz uslov da u istoriji postoji bar toliko upisa.
 *
 * 🔴 ISTORIJA SE NE BRIŠE (pravilo 6 iz `CLAUDE.md`). Prva verzija je upis i protivzapis
 * brisala „kao da se nikada nisu desili", zajedno sa obaveštenjima. Sada ostaju i upis
 * i protivzapis, a nadzornik dobija obaveštenje sa razlogom — inače bi video stanje
 * manje za n × 500 bez ijednog reda i bez reči koja to objašnjava.
 *
 * 🔴 Sve u JEDNOJ transakciji, uz proveru da se svako pogođeno stanje slaže sa zbirom
 * svojih zapisa i pre i posle (obrazac `potvrde-parovi.ts`). Niko ne ide u minus: to bi
 * bio osnov negativnog zapisa koji Pravilnik čl. 14 st. 3 ne poznaje, a kapiranje na
 * nulu nije izlaz (pravilo 4). Radnja je ponovljiva: posle nje nema živih veza, pa drugi
 * put nema šta da se poništi.
 *
 * Ugašen nalog se preskače u knjiženju: njegov zapis je pri gašenju već poništen u
 * celini (Pravilnik čl. 34), pa mu se veze samo gase.
 *
 * Pregled i sprovođenje idu kroz ISTU funkciju (`suviHod`), da se brojevi ne raziđu.
 */
import { prisma } from "@/lib/prisma";
import { PotvrdaPoenStatus, TransactionType } from "@/generated/prisma/client";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { POEN_NADZORNIK } from "@/lib/protokol/dokaz-stvarnosti";

const PROTOKOL_WALLET_ID = "banka-singleton";
const OPIS_PROTIVZAPISA =
  "Poništenje POEN-a za nadzor — nadzor se više ne plaća (dokaz stvarnosti čl. 22b)";

export type NadzorUcesnik = {
  pseudonim: string;
  upisa: number;
  poen: number;
  stanjePre: number;
  stanjePosle: number;
};

export type NadzorUklanjanjeIshod = {
  sprovedeno: boolean;
  /** Živih upisa za nadzor koji se poništavaju. */
  upisa: number;
  /** Ukupno POEN-a koji se skida nadzornicima. */
  poen: number;
  /** Veza sa zabeleženim a neupisanim 500 — gase se. */
  zabelezenihGasi: number;
  /** Obaveštenja koja se šalju — po jedno svakom nadzorniku kome se skida. */
  obavestenja: number;
  opticajPre: number;
  opticajPosle: number;
  zeroSum: number;
  prepreke: string[];
  ucesnici: NadzorUcesnik[];
};

type Klijent = Pick<typeof prisma, "transaction">;

/** Zbir zapisa po novčaniku: ušlo minus izašlo. */
async function istorijaPoWalletu(klijent: Klijent, walletIds: string[]): Promise<Map<string, number>> {
  const [ulazi, izlazi] = await Promise.all([
    klijent.transaction.groupBy({
      by: ["toWalletId"],
      where: { toWalletId: { in: walletIds } },
      _sum: { amount: true },
    }),
    klijent.transaction.groupBy({
      by: ["fromWalletId"],
      where: { fromWalletId: { in: walletIds } },
      _sum: { amount: true },
    }),
  ]);
  const ulaz = new Map(ulazi.map((u) => [u.toWalletId, u._sum.amount ?? 0]));
  const izlaz = new Map(izlazi.map((i) => [i.fromWalletId ?? "", i._sum.amount ?? 0]));
  return new Map(walletIds.map((id) => [id, (ulaz.get(id) ?? 0) - (izlaz.get(id) ?? 0)]));
}

export async function ukloniPoenNadzora(opcije: {
  suviHod: boolean;
  adminId?: string;
}): Promise<NadzorUklanjanjeIshod> {
  const prepreke: string[] = [];

  const [zbirSvih, protokol, zive, zabelezenih] = await Promise.all([
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.wallet.findUnique({ where: { id: PROTOKOL_WALLET_ID }, select: { balance: true } }),
    // Žive veze po nadzorniku — jedini pouzdan broj neponištenih 500.
    prisma.verifikacionaVeza.groupBy({
      by: ["nadzornikId"],
      where: { nadzorPoenStatus: PotvrdaPoenStatus.EVIDENTIRAN, nadzornikId: { not: null } },
      _count: { _all: true },
    }),
    prisma.verifikacionaVeza.count({
      where: { nadzorPoenStatus: PotvrdaPoenStatus.ZABELEZEN, nadzoranAt: { not: null } },
    }),
  ]);
  const zeroSum = zbirSvih._sum.balance ?? 0;
  const opticajPre = Math.abs(protokol?.balance ?? 0);
  if (zeroSum !== 0) prepreke.push(`Zero-sum nije nula (${zeroSum}) — to je teži problem od ovoga.`);

  const zivihPoKorisniku = new Map<string, number>();
  for (const g of zive) if (g.nadzornikId) zivihPoKorisniku.set(g.nadzornikId, g._count._all);

  const korisnici = await prisma.user.findMany({
    where: { id: { in: [...zivihPoKorisniku.keys()] } },
    select: { id: true, pseudonim: true, deaktiviranAt: true, wallet: { select: { id: true, balance: true } } },
  });
  // Ugašen nalog: zapis je već poništen u celini (čl. 34) — samo se gase veze.
  const aktivni = korisnici.filter((k) => !k.deaktiviranAt && k.wallet);

  const walletIds = aktivni.map((k) => k.wallet!.id);
  const upisaPoWalletu = new Map<string, number>();
  if (walletIds.length > 0) {
    const g = await prisma.transaction.groupBy({
      by: ["toWalletId"],
      where: { type: TransactionType.EMISIJA_NADZOR, toWalletId: { in: walletIds } },
      _count: { _all: true },
    });
    for (const r of g) upisaPoWalletu.set(r.toWalletId, r._count._all);
  }

  const stavke = aktivni.map((k) => {
    const zivih = zivihPoKorisniku.get(k.id) ?? 0;
    const uIstoriji = upisaPoWalletu.get(k.wallet!.id) ?? 0;
    if (uIstoriji < zivih) {
      prepreke.push(
        `${k.pseudonim}: živih veza ${zivih}, a upisa za nadzor u istoriji ${uIstoriji} — razumeti to PRE poništenja.`,
      );
    }
    return { userId: k.id, walletId: k.wallet!.id, pseudonim: k.pseudonim, upisa: zivih, poen: zivih * POEN_NADZORNIK, stanje: k.wallet!.balance };
  });

  const proveravani = [...walletIds, PROTOKOL_WALLET_ID];
  const istorijaPre = await istorijaPoWalletu(prisma, proveravani);
  const neslozeni = stavke.filter((s) => (istorijaPre.get(s.walletId) ?? 0) !== s.stanje);
  if (neslozeni.length > 0) {
    prepreke.push(
      `${neslozeni.length} nalog(a) već sada ima stanje različito od zbira svojih zapisa — razumeti to PRE poništenja.`,
    );
  }

  const ucesnici: NadzorUcesnik[] = stavke
    .map((s) => ({ pseudonim: s.pseudonim, upisa: s.upisa, poen: s.poen, stanjePre: s.stanje, stanjePosle: s.stanje - s.poen }))
    .sort((a, b) => b.poen - a.poen);

  const uMinus = ucesnici.filter((u) => u.stanjePosle < 0);
  if (uMinus.length > 0) {
    prepreke.push(
      `${uMinus.length} nalog(a) bi otišlo u minus (${uMinus.map((u) => u.pseudonim).join(", ")}) — ` +
        `to je osnov negativnog zapisa koji Pravilnik čl. 14 st. 3 ne poznaje. Radnja se ne sprovodi.`,
    );
  }

  const poen = stavke.reduce((s, x) => s + x.poen, 0);
  const upisa = stavke.reduce((s, x) => s + x.upisa, 0);
  const ishod: NadzorUklanjanjeIshod = {
    sprovedeno: false,
    upisa,
    poen,
    zabelezenihGasi: zabelezenih,
    obavestenja: stavke.filter((s) => s.poen > 0).length,
    opticajPre,
    opticajPosle: opticajPre - poen,
    zeroSum,
    prepreke,
    ucesnici,
  };

  if (opcije.suviHod || prepreke.length > 0) return ishod;
  if (zivihPoKorisniku.size === 0 && zabelezenih === 0) return ishod;

  await prisma.$transaction(
    async (tx) => {
      // 1) Protivzapis po nadzorniku — stanja se pomeraju ovde, i samo ovde.
      for (const s of stavke) {
        if (s.poen <= 0) continue;
        await tx.wallet.update({ where: { id: s.walletId }, data: { balance: { decrement: s.poen } } });
        await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: s.poen } } });
        await tx.transaction.create({
          data: {
            fromWalletId: s.walletId,
            toWalletId: PROTOKOL_WALLET_ID,
            amount: s.poen,
            type: TransactionType.PONISTENJE_ZAPISA,
            description: OPIS_PROTIVZAPISA,
          },
        });
      }

      // 2) Veze se gase — žive i zabeležene. `nadzorTxId` ostaje kao trag.
      await tx.verifikacionaVeza.updateMany({
        where: { nadzorPoenStatus: { in: [PotvrdaPoenStatus.EVIDENTIRAN, PotvrdaPoenStatus.ZABELEZEN] } },
        data: { nadzorPoenStatus: PotvrdaPoenStatus.PONISTEN },
      });

      // 🔴 Brana: svako pogođeno stanje mora se slagati sa zbirom svojih zapisa.
      const istorijaPosle = await istorijaPoWalletu(tx, proveravani);
      const stanja = await tx.wallet.findMany({
        where: { id: { in: proveravani } },
        select: { id: true, balance: true },
      });
      for (const w of stanja) {
        if ((istorijaPosle.get(w.id) ?? 0) !== w.balance) {
          throw new Error(
            `Novčanik ${w.id}: stanje ${w.balance} se razišlo sa istorijom ${istorijaPosle.get(w.id) ?? 0} — radnja je poništena.`,
          );
        }
        if (w.id !== PROTOKOL_WALLET_ID && w.balance < 0) {
          throw new Error(`Novčanik ${w.id} bi otišao u minus — radnja je poništena.`);
        }
      }
      const z = await tx.wallet.aggregate({ _sum: { balance: true } });
      if ((z._sum.balance ?? 0) !== 0) throw new Error("Zero-sum narušen — radnja je poništena.");
    },
    { timeout: 120_000 },
  );

  // 3) Obaveštenje svakom nadzorniku — van transakcije, ne baca.
  for (const s of stavke) {
    if (s.poen <= 0) continue;
    const iznos = s.poen.toLocaleString("sr-RS");
    await obavesti(s.userId, {
      tip: "potvrda_poen",
      kljuc: "notifikacije.nadzor_poen_ponisten",
      parametri: { iznos },
      naslov: "POEN za nadzor je poništen",
      tekst:
        `Nadzor se više ne plaća POEN-om. Zato je sa tvog zapisa poništeno ${iznos} POENA ` +
        `koji su ti ranije bili upisani za obavljen nadzor. Upis i poništenje ostaju vidljivi ` +
        `u tvojoj istoriji. Ako misliš da je poništenje pogrešno, možeš da podneseš prigovor sa profila.`,
      link: "/novcanik",
    }).catch((e) => console.error("[nadzor-poen] obaveštenje nije poslato:", e));
  }

  if (opcije.adminId) {
    await logAdminAkcija(
      opcije.adminId,
      "NADZOR_POEN_UKLONJEN",
      undefined,
      `Poništeno ${upisa} živih upisa za nadzor (${poen} POEN) nad ${ishod.obavestenja} naloga, ` +
        `ugašeno ${zabelezenih} zabeleženih. Istorija zadržana. Dokaz stvarnosti čl. 22b.`,
    );
  }

  return { ...ishod, sprovedeno: true };
}
