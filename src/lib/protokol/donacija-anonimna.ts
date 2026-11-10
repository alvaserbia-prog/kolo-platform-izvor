/**
 * Prevođenje javne donacije u anonimnu (Pravilnik o pokroviteljstvu i donacijama
 * čl. 12; Pravilnik o KOLO sistemu čl. 17 st. 2 t. 11; Politika čl. 21 st. 5; set 5.1.2).
 *
 * Do seta 5.1.2 donator je samo „povlačio ime“ iz liste, a POEN je ostajao. Sada je
 * prikaz imena uslov evidentiranja POEN-a (donacije čl. 7 st. 1), pa se zahtev da
 * ime ne stoji uz donaciju izvršava kao prevođenje u anonimnu:
 *
 *  1. ime se briše iz zapisa donacije (`donatorIme = null`), a donacija ostaje u listi
 *     iznosom i datumom, sada kao anonimna (`javno = false`);
 *  2. doprinos evidentiran po toj donaciji (`poenEmitted`) poništava se protivzapisom u
 *     korist Protokola, SOPSTVENIM tipom `PONISTENJE_ANONIMNA_DONACIJA` (nikad `TRANSFER`
 *     ni `EMISIJA_*`), i kada zapis donatora time postane negativan — jedanaesti osnov
 *     negativnog zapisa (Pravilnik čl. 17 st. 2 t. 11);
 *  3. donacija izlazi iz kumulativne donacije (kumulativ se čita samo iz `javno: true`),
 *     pa se nivo za naredne donacije sam ponovo utvrđuje iz preostalih javnih donacija
 *     (čl. 8 st. 5; kad ih nema, nivo 1). 🔴 POEN evidentiran po DRUGIM donacijama se ne
 *     dira, a snimljeni `poenEmitted`, `level`, `cumulativeRSD` i `ugovorTekst` ostaju
 *     kao istorija (pravilo 11);
 *  4. donator dobija obaveštenje sa iznosom poništenja, i da je zapis negativan ako jeste
 *     (pravilo 3).
 *
 * 🔴 Prestanak statusa (gašenje naloga, isključenje) briše ime BEZ ovog poništenja
 * (čl. 12 st. 2) — to ide kroz `ugasiOznakeNaloga` u `izlaz-naloga.ts`, ne ovde.
 * 🔴 Prevođenje ne briše ime iz evidencije identiteta (čl. 12 st. 3).
 *
 * Zero-sum: par „donator → Protokol“ ide ceo, u istoj transakciji sa promenom zapisa
 * donacije, uz proveru `balance == Σ(ulaz) − Σ(izlaz)` po pogođenom zapisu (obrazac
 * `potvrde-parovi.ts`; CLAUDE.md pravilo 1). Brana: `__tests__/donacija-anonimna-izvor.test.ts`.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { TransactionType, DonationStatus } from "@/generated/prisma/client";
import { PROTOKOL_WALLET_ID } from "./zrno";
import { obavesti } from "@/lib/notifikacije";
import { nivoZaKumulativ } from "@/lib/donacija-pravila";

type Tx = Prisma.TransactionClient;

export class AnonimnaDonacijaGreska extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Razlika stanja i istorije po zapisu — par mora ostaviti istu razliku (pravilo 1). */
async function razlikaStanjaIIstorije(tx: Tx, walletId: string): Promise<number> {
  const [w, ulaz, izlaz] = await Promise.all([
    tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
    tx.transaction.aggregate({ where: { toWalletId: walletId }, _sum: { amount: true } }),
    tx.transaction.aggregate({ where: { fromWalletId: walletId }, _sum: { amount: true } }),
  ]);
  return w.balance - ((ulaz._sum.amount ?? 0) - (izlaz._sum.amount ?? 0));
}

/** Uslov pod kojim se donacija sme prevesti: sopstvena, potvrđena, javna. */
export function uslovPrevoda(userId: string, donationId: string) {
  return { id: donationId, userId, status: DonationStatus.CONFIRMED, javno: true } as const;
}

export type PregledPrevoda = {
  /** Koliko POEN-a će biti poništeno (doprinos evidentiran po toj donaciji). */
  ponistava: number;
  /** Stanje zapisa donatora posle poništenja (može biti negativno). */
  stanjePosle: number;
  /** Nivo za naredne donacije posle prevođenja. */
  nivoPosle: number;
};

/**
 * Pregled pre potvrde: ekran mora jasno da kaže koliko POEN-a će biti poništeno
 * i da li će zapis postati negativan.
 */
export async function pregledPrevodaUAnonimnu(userId: string, donationId: string): Promise<PregledPrevoda> {
  const d = await prisma.donationRecord.findFirst({ where: uslovPrevoda(userId, donationId), select: { poenEmitted: true } });
  if (!d) throw new AnonimnaDonacijaGreska("Donacija nije pronađena ili nije javna.", 404);
  const [w, preostale] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
    prisma.donationRecord.aggregate({
      where: { userId, status: DonationStatus.CONFIRMED, javno: true, id: { not: donationId } },
      _sum: { amountRSD: true },
    }),
  ]);
  const ponistava = Math.max(0, d.poenEmitted);
  return {
    ponistava,
    stanjePosle: (w?.balance ?? 0) - ponistava,
    nivoPosle: nivoZaKumulativ(Number(preostale._sum.amountRSD ?? 0)).nivo,
  };
}

/**
 * Donator prevodi sopstvenu javnu donaciju u anonimnu (donacije čl. 12 st. 1).
 * Jednosmerno: anonimna donacija se ne vraća u javnu, a ime se ne čuva.
 */
export async function prevediUAnonimnu(userId: string, donationId: string): Promise<PregledPrevoda> {
  const wallet = await prisma.wallet.findUnique({ where: { userId }, select: { id: true } });
  if (!wallet) throw new AnonimnaDonacijaGreska("Nemaš zapis u Protokolu.", 409);
  const sada = new Date();

  const { ponistava, stanjePosle } = await prisma.$transaction(async (tx) => {
    const d = await tx.donationRecord.findFirst({ where: uslovPrevoda(userId, donationId), select: { id: true, poenEmitted: true } });
    if (!d) throw new AnonimnaDonacijaGreska("Donacija nije pronađena ili nije javna.", 404);

    // Uslov u samom upisu: dva istovremena zahteva ne poništavaju dvaput.
    const r = await tx.donationRecord.updateMany({
      where: uslovPrevoda(userId, donationId),
      data: { javno: false, donatorIme: null, imePovucenoAt: sada, prevedenaUAnonimnuAt: sada },
    });
    if (r.count !== 1) throw new AnonimnaDonacijaGreska("Donacija je u međuvremenu obrađena.", 409);

    const iznos = Math.max(0, d.poenEmitted);
    if (iznos > 0) {
      const pre = await razlikaStanjaIIstorije(tx, wallet.id);
      // Par ide ceo: donator −X, Protokol +X. Zapis donatora sme u minus (čl. 17 st. 2 t. 11).
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: iznos } } });
      await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: iznos } } });
      await tx.transaction.create({
        data: {
          fromWalletId: wallet.id,
          toWalletId: PROTOKOL_WALLET_ID,
          amount: iznos,
          type: TransactionType.PONISTENJE_ANONIMNA_DONACIJA,
          description: "Poništenje doprinosa po donaciji prevedenoj u anonimnu",
          opisKljuc: "transakcije.anonimna_donacija_ponistenje",
        },
      });
      if ((await razlikaStanjaIIstorije(tx, wallet.id)) !== pre)
        throw new AnonimnaDonacijaGreska("Stanje zapisa se ne slaže sa istorijom — radnja je poništena.", 500);
    }
    const w = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id }, select: { balance: true } });
    return { ponistava: iznos, stanjePosle: w.balance };
  });

  // Nivo za naredne donacije — iz preostalih javnih donacija (čl. 8 st. 5).
  const preostale = await prisma.donationRecord.aggregate({
    where: { userId, status: DonationStatus.CONFIRMED, javno: true },
    _sum: { amountRSD: true },
  });
  const nivoPosle = nivoZaKumulativ(Number(preostale._sum.amountRSD ?? 0)).nivo;

  // Minus se nikad ne pojavljuje bez reči (pravilo 3).
  const minus = stanjePosle < 0;
  await obavesti(userId, {
    tip: "donacija_anonimna",
    kljuc: minus ? "notifikacije.donacija_anonimna_minus" : "notifikacije.donacija_anonimna",
    parametri: { iznos: ponistava, stanje: stanjePosle, nivo: nivoPosle },
    naslov: minus ? "Donacija je prevedena u anonimnu: zapis je u minusu" : "Donacija je prevedena u anonimnu",
    tekst:
      `Po tvom zahtevu donacija je prevedena u anonimnu: ime je uklonjeno iz liste, a poništeno je ${ponistava.toLocaleString("sr-RS")} POEN evidentiranih po toj donaciji (Pravilnik o KOLO sistemu čl. 17 st. 2 t. 11). Nivo za naredne donacije je ${nivoPosle}.` +
      (minus ? ` Tvoj zapis je sada ${stanjePosle.toLocaleString("sr-RS")} POEN; to nije dug i ne naplaćuje se, a POEN koji pristigne prvo popunjava minus.` : ""),
    link: "/donacije",
  }).catch(() => {});

  return { ponistava, stanjePosle, nivoPosle };
}
