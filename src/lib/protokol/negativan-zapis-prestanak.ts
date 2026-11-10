/**
 * Negativan zapis pri prestanku statusa (Pravilnik o KOLO sistemu čl. 17 st. 2 t. 12
 * i čl. 33 st. 7; Uslovi korišćenja čl. 33 st. 3; Politika privatnosti čl. 42 st. 7;
 * Registar radnji obrade br. 29; set 5.1.2).
 *
 * Četiri dela:
 *  1. `sacuvajNegativanZapisPriPrestanku` — u TRANSAKCIJI izlaza (istupanje u
 *     `DELETE /api/profil`, isključenje u `iskljuciKorisnika`), PRE brisanja podataka:
 *     kad je zapis negativan, uz interni id i pseudonim čuvaju se iznos, datum
 *     prestanka, ime i prezime iz evidencije identiteta i mesto i broj sa profila.
 *     Negativan zapis i dalje ostaje uz pseudonimizovanu istoriju (čl. 33 st. 2).
 *  2. `nalaziNegativnihZapisa` — poređenje sa nalozima otvorenim posle prestanka, za
 *     superadmina (Admin → Potvrde). 🔴 Ništa ne blokira; nalaz nije odluka.
 *  3. `prenesiNegativanZapis` — odluka Fondacije (samo superadmin, obrazloženje): u
 *     ISTOJ transakciji jedan zapis tipom `PRENOS_NEGATIVNOG_ZAPISA` (nov → prestali),
 *     uz proveru `balance == Σ(ulaz) − Σ(izlaz)` po oba novčanika; red se briše; nov
 *     nalog dobija obaveštenje sa iznosom i osnovom.
 *  4. `obrisiIstekleNegativneZapise` — noćni cron briše redove kojima je prošlo pet godina.
 *
 * 🔴 Ime, broj i mesto iz reda ne vraćaju se nijednoj ruti osim superadminu, ne idu u
 * GDPR izvoz (red nije vezan za nov nalog), opis transakcije, audit log ni obaveštenje.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { TransactionType } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import {
  istekCuvanja,
  MIN_OBRAZLOZENJE,
  poklapanja,
  trebaSacuvati,
  type OsnovPoklapanja,
  type OsnovPrestanka,
} from "@/lib/negativan-zapis-prestanak-pravila";
import { iznosNadoknade } from "./nadoknada";

export * from "@/lib/negativan-zapis-prestanak-pravila";

type Tx = Prisma.TransactionClient;

export class NegativanZapisGreska extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/**
 * Čuva red kad je zapis negativan. Zove se u transakciji izlaza, PRE nego što se
 * obrišu ime (`ugasiOznakeNaloga` → `obrisiIdentitet`), mesto i broj (`DELETE
 * /api/profil`). Vraća da li je red sačuvan. Brisanje naloga se ničim ne uslovljava.
 */
export async function sacuvajNegativanZapisPriPrestanku(tx: Tx, userId: string, osnov: OsnovPrestanka): Promise<boolean> {
  const u = await tx.user.findUnique({
    where: { id: userId },
    select: {
      pseudonim: true,
      maloletan: true,
      telefon: true,
      location: true,
      wallet: { select: { balance: true } },
      identitet: { select: { imePrezime: true } },
    },
  });
  if (!u) return false;
  const stanje = u.wallet?.balance ?? 0;
  if (!trebaSacuvati({ stanje, maloletan: u.maloletan })) return false;
  const prestanakAt = new Date();
  const podaci = {
    pseudonim: u.pseudonim,
    iznos: iznosNadoknade(stanje),
    osnov,
    prestanakAt,
    istice: istekCuvanja(prestanakAt),
    imePrezime: u.identitet?.imePrezime ?? null,
    mesto: u.location ?? null,
    telefon: u.telefon ?? null,
  };
  await tx.negativanZapisPrestanak.upsert({
    where: { prestaliId: userId },
    create: { prestaliId: userId, ...podaci },
    update: podaci,
  });
  return true;
}

export type NalazNegativnogZapisa = {
  redId: string;
  prestaliPseudonim: string;
  iznos: number;
  prestanakAt: string;
  osnovPrestanka: string;
  nalog: { id: string; pseudonim: string; mesto: string | null };
  osnovi: OsnovPoklapanja[];
  istoMesto: boolean;
};

/**
 * Nalazi za superadmina (Admin → Potvrde): sačuvan red ↔ živ punoletni nalog otvoren
 * posle prestanka, sa istim brojem telefona ili istim imenom i prezimenom. Bez imena
 * i broja u odgovoru — samo pseudonimi, mesto novog naloga, iznos i osnov poklapanja.
 */
export async function nalaziNegativnihZapisa(sada: Date = new Date()): Promise<NalazNegativnogZapisa[]> {
  const redovi = await prisma.negativanZapisPrestanak.findMany({ where: { istice: { gt: sada } } });
  if (redovi.length === 0) return [];
  const najraniji = new Date(Math.min(...redovi.map((r) => r.prestanakAt.getTime())));
  const nalozi = await prisma.user.findMany({
    where: {
      deaktiviranAt: null,
      status: { not: "EXCLUDED" },
      maloletan: false,
      createdAt: { gte: najraniji },
      OR: [{ telefon: { not: null } }, { identitet: { isNot: null } }],
    },
    select: { id: true, pseudonim: true, createdAt: true, telefon: true, location: true, identitet: { select: { imePrezime: true } } },
  });
  const p = poklapanja(
    redovi,
    nalozi.map((n) => ({
      id: n.id,
      createdAt: n.createdAt,
      telefon: n.telefon,
      mesto: n.location,
      imePrezime: n.identitet?.imePrezime ?? null,
    })),
    sada,
  );
  return p.map((x) => {
    const r = redovi.find((y) => y.id === x.redId)!;
    const n = nalozi.find((y) => y.id === x.nalogId)!;
    return {
      redId: r.id,
      prestaliPseudonim: r.pseudonim,
      iznos: r.iznos,
      prestanakAt: r.prestanakAt.toISOString(),
      osnovPrestanka: r.osnov,
      nalog: { id: n.id, pseudonim: n.pseudonim, mesto: n.location },
      osnovi: x.osnovi,
      istoMesto: x.istoMesto,
    };
  });
}

/** Razlika između upisanog stanja i zbira zapisa (pravilo 1; obrazac `potvrde-parovi.ts`). */
async function razlikaStanjaIIstorije(tx: Tx, walletId: string): Promise<number> {
  const [w, ulaz, izlaz] = await Promise.all([
    tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
    tx.transaction.aggregate({ where: { toWalletId: walletId }, _sum: { amount: true } }),
    tx.transaction.aggregate({ where: { fromWalletId: walletId }, _sum: { amount: true } }),
  ]);
  return w.balance - ((ulaz._sum.amount ?? 0) - (izlaz._sum.amount ?? 0));
}

/**
 * Utvrđenje da je nov nalog nalog istog lica i prenos negativnog zapisa (Pravilnik
 * čl. 33 st. 7; dvanaesti osnov, čl. 17 st. 2 t. 12). Samo superadmin, obrazloženje
 * obavezno. Prenosi se onoliko koliko je prestali zapis i sada u minusu; prestali
 * zapis time dolazi na nulu, a nov sme u minus.
 */
export async function prenesiNegativanZapis(
  adminId: string,
  p: { redId: string; noviId: string; obrazlozenje: string },
): Promise<{ preneto: number; stanje: number }> {
  const obrazlozenje = typeof p.obrazlozenje === "string" ? p.obrazlozenje.trim() : "";
  if (obrazlozenje.length < MIN_OBRAZLOZENJE) throw new NegativanZapisGreska("Obrazloženje je obavezno.");

  const rezultat = await prisma.$transaction(async (tx) => {
    const red = await tx.negativanZapisPrestanak.findUnique({ where: { id: p.redId } });
    if (!red) throw new NegativanZapisGreska("Sačuvan negativan zapis nije pronađen.", 404);
    if (red.istice.getTime() <= Date.now()) throw new NegativanZapisGreska("Rok od pet godina je istekao.", 409);
    if (red.prestaliId === p.noviId) throw new NegativanZapisGreska("Nov nalog mora biti drugi nalog.", 409);

    const novi = await tx.user.findUnique({
      where: { id: p.noviId },
      select: { id: true, pseudonim: true, maloletan: true, deaktiviranAt: true, status: true, createdAt: true, wallet: { select: { id: true } } },
    });
    if (!novi || !novi.wallet) throw new NegativanZapisGreska("Nalog nije pronađen.", 404);
    if (novi.maloletan) throw new NegativanZapisGreska("Prenos se ne odnosi na maloletni nalog.", 409);
    if (novi.deaktiviranAt || novi.status === "EXCLUDED") throw new NegativanZapisGreska("Nov nalog mora biti živ.", 409);
    if (novi.createdAt.getTime() < red.prestanakAt.getTime())
      throw new NegativanZapisGreska("Nalog nije otvoren posle prestanka statusa.", 409);

    const prestaliW = await tx.wallet.findUnique({ where: { userId: red.prestaliId }, select: { id: true, balance: true } });
    const iznos = prestaliW ? iznosNadoknade(prestaliW.balance) : 0;
    const noviW = novi.wallet.id;

    let transakcijaId: string | null = null;
    if (prestaliW && iznos > 0) {
      const preP = await razlikaStanjaIIstorije(tx, prestaliW.id);
      const preN = await razlikaStanjaIIstorije(tx, noviW);
      // Par u istoj transakciji: −iznos na novom, +iznos na prestalom (protivzapis).
      await tx.wallet.update({ where: { id: noviW }, data: { balance: { decrement: iznos } } });
      await tx.wallet.update({ where: { id: prestaliW.id }, data: { balance: { increment: iznos } } });
      const t = await tx.transaction.create({
        data: {
          fromWalletId: noviW,
          toWalletId: prestaliW.id,
          amount: iznos,
          type: TransactionType.PRENOS_NEGATIVNOG_ZAPISA,
          description: "Prenos negativnog zapisa sa prestalog naloga istog lica (Pravilnik čl. 33 st. 7)",
          opisKljuc: "transakcije.prenos_negativnog_zapisa",
        },
      });
      transakcijaId = t.id;
      if ((await razlikaStanjaIIstorije(tx, prestaliW.id)) !== preP || (await razlikaStanjaIIstorije(tx, noviW)) !== preN)
        throw new NegativanZapisGreska("Stanje zapisa se ne slaže sa istorijom — radnja je poništena.", 500);
      await tx.prenosNegativnogZapisa.create({
        data: {
          prestaliId: red.prestaliId,
          prestaliPseudonim: red.pseudonim,
          noviId: novi.id,
          iznos,
          obrazlozenje,
          utvrdioId: adminId,
          transakcijaId: t.id,
        },
      });
    }
    // Po prenosu (odnosno kad nema šta da se prenese) podaci se brišu (čl. 33 st. 7).
    await tx.negativanZapisPrestanak.delete({ where: { id: red.id } });
    const stanje = (await tx.wallet.findUniqueOrThrow({ where: { id: noviW }, select: { balance: true } })).balance;
    return { preneto: transakcijaId ? iznos : 0, stanje, novi, prestaliPseudonim: red.pseudonim };
  });

  // Obaveštenje — VAN transakcije, ne baca; bez imena i broja (pravilo 3).
  if (rezultat.preneto > 0) {
    try {
      await obavesti(rezultat.novi.id, {
        tip: "negativan_zapis_prenos",
        kljuc: "notifikacije.prenos_negativnog_zapisa",
        parametri: { poen: rezultat.preneto, stanje: rezultat.stanje, obrazlozenje },
        naslov: "Negativan zapis je prenet na tvoj nalog",
        tekst:
          `Fondacija je utvrdila da si ranije imao nalog koji je prestao dok mu je zapis bio negativan. ` +
          `Taj negativan zapis (${rezultat.preneto} POEN) prenet je na ovaj nalog (Pravilnik o KOLO sistemu čl. 33 st. 7 i čl. 17 st. 2 t. 12). ` +
          `Tvoj zapis je sada ${rezultat.stanje} POEN; POEN koji pristigne prvo popunjava minus. ` +
          `Na odluku možeš podneti prigovor u roku od 15 dana. Obrazloženje: ${obrazlozenje}`,
        link: "/novcanik",
      });
    } catch (e) {
      console.error("[negativan-zapis] obaveštenje nije poslato", rezultat.novi.id, e);
    }
  }

  await logAdminAkcija(
    adminId,
    "NEGATIVAN_ZAPIS_PRENET",
    rezultat.novi.id,
    `prestao ${rezultat.prestaliPseudonim}, nov ${rezultat.novi.pseudonim}, preneto ${rezultat.preneto} POEN; ${obrazlozenje}`,
  );
  return { preneto: rezultat.preneto, stanje: rezultat.stanje };
}

/** Noćno brisanje redova kojima je istekao rok od pet godina (čl. 33 st. 7). */
export async function obrisiIstekleNegativneZapise(sada: Date = new Date()): Promise<number> {
  const r = await prisma.negativanZapisPrestanak.deleteMany({ where: { istice: { lte: sada } } });
  return r.count;
}
