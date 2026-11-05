import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { TransactionType, DonationStatus } from "@/generated/prisma/client";
import { PROTOKOL_WALLET_ID } from "./zrno";
import { emitujPoen } from "./emisija";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { upisiIdentitet, procitajImePrezime, istoIme, imeNaloga } from "./identitet";
import { ponudiSpisak, donacijaVodiNaSpisak } from "./zahtev-razgovor";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";
import { izracunajPoenZaDonaciju, normalizujUplatioca } from "@/lib/donacija-pravila";
import { generisiUgovorODonaciji } from "@/lib/donacija-ugovor";
import {
  smeUnapred,
  iznosOgranicenja,
  rokOgranicenja,
  uporediPotvrdu,
  MAX_POTVRDA_BAJTOVA,
  DOZVOLJENI_TIPOVI_POTVRDE,
} from "@/lib/donacija-unapred-pravila";
import { procitajPotvrdu, hashPotvrde } from "@/lib/placanje/citanje-potvrde";
import { dohvatiIpsConfig, pozivNaBrojZaDonaciju, pozivNaBrojZaPrijavu } from "@/lib/placanje/ips-qr";
import { RACUN_FONDACIJE } from "@/lib/placanje/racun-fondacije";
import { beogradskiDan, ponocUSrbiji } from "./obracunski-dan";

/** Početak tekućeg obračunskog perioda (ponoć po srpskom vremenu). */
function pocetakObracunskogDana(sada: Date): Date {
  return ponocUSrbiji(beogradskiDan(sada));
}

/**
 * Donacija unapred, potvrda o uplati i ograničenje primljenog iznosa
 * (Pravilnik o pokroviteljstvu i donacijama čl. 6 st. 4–9; Pravilnik o KOLO sistemu
 * čl. 17 st. 2 t. 10 i čl. 36 st. 3 i 6; set 5.0.9, odluke vlasnika 05.11.2026).
 *
 * Tok:
 *  1. Donator uplati sa računa (IPS QR, nalog za prenos) uz POSEBAN poziv na broj i
 *     pošalje potvrdu o uplati (`prihvatiPotvrdu`). Platforma je čita na našem serveru.
 *  2. Ako je donatoru prijem javnih donacija već utvrđen do praga, potvrda se poklapa i
 *     u periodu još nema donacije unapred — POEN se evidentira ODMAH (`NA_PROVERI`).
 *     Inače zapis čeka Fondaciju kao i do sada (`PENDING` sa potvrdom).
 *  3. Fondacija u roku od 24 časa utvrđuje prijem (`utvrdiPrijemUnapred`) ili poništava
 *     (`ponistiUnapred`) — protivzapisom `PONISTENJE_DONACIJE`, i u minus (deseti osnov).
 *  4. Uz osnov sumnje da je potvrda lažna ili tuđa, iznos koji je donator od evidentiranja
 *     prepisao drugima OGRANIČAVA se kod primalaca (`OgranicenjePrimljenog`, najduže 7
 *     dana). Fondacija za svakog odlučuje (`odluciOgranicenje`): znao je → otpis celog
 *     primljenog iznosa (`OTPIS_PRIMLJENOG_DONACIJA`, sme u minus); nije → ograničenje prestaje.
 *
 * 🔴 Odgovor banke ni ovde ne evidentira ništa — okidač je potvrda koju je čovek poslao,
 * a ne callback. 🔴 Ograničenje je jednokratno, samo za taj slučaj i samo nad prepisima
 * od donatora posle evidentiranja unapred: to NIJE praćenje prepisa (odbijena mera).
 */

type Tx = Prisma.TransactionClient;

export class DonacijaUnapredGreska extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// ─── Ograničenje primljenog iznosa ──────────────────────────────────────────

export { ograniceno } from "./ogranicenje-primljenog";

/** Zbir stanja i istorije po zapisu — par mora ostati usklađen (CLAUDE.md pravilo 1). */
async function razlikaStanjaIIstorije(tx: Tx, walletId: string): Promise<number> {
  const [w, ulaz, izlaz] = await Promise.all([
    tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
    tx.transaction.aggregate({ where: { toWalletId: walletId }, _sum: { amount: true } }),
    tx.transaction.aggregate({ where: { fromWalletId: walletId }, _sum: { amount: true } }),
  ]);
  return w.balance - ((ulaz._sum.amount ?? 0) - (izlaz._sum.amount ?? 0));
}

/** Par „korisnik → Protokol" sopstvenim tipom; zapis sme u minus (deseti osnov). */
async function uProtokol(
  tx: Tx,
  walletId: string,
  iznos: number,
  tip: TransactionType,
  opis: string,
  opisKljuc: string,
): Promise<string> {
  const pre = await razlikaStanjaIIstorije(tx, walletId);
  await tx.wallet.update({ where: { id: walletId }, data: { balance: { decrement: iznos } } });
  await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: iznos } } });
  const t = await tx.transaction.create({
    data: { fromWalletId: walletId, toWalletId: PROTOKOL_WALLET_ID, amount: iznos, type: tip, description: opis, opisKljuc },
  });
  if ((await razlikaStanjaIIstorije(tx, walletId)) !== pre)
    throw new DonacijaUnapredGreska("Stanje zapisa se ne slaže sa istorijom — radnja je poništena.", 500);
  return t.id;
}

async function obavestiRoditelje(deteId: string, poruka: Parameters<typeof obavesti>[1]) {
  const veze = await prisma.roditeljstvo.findMany({ where: { deteId }, select: { roditeljId: true } });
  for (const v of veze) await obavesti(v.roditeljId, poruka).catch(() => {});
}

// ─── Potvrda o uplati ───────────────────────────────────────────────────────

/** Račun Fondacije koji potvrda mora da nosi. */
function racunFondacije(): string {
  return dohvatiIpsConfig()?.racun ?? RACUN_FONDACIJE;
}

/** Zbir javnih donacija čiji je prijem utvrđen — osnov za prag donacije unapred. */
async function utvrdjenoUkupno(userId: string): Promise<number> {
  const r = await prisma.donationRecord.aggregate({
    where: { userId, javno: true, status: DonationStatus.CONFIRMED },
    _sum: { amountRSD: true },
  });
  return Number(r._sum.amountRSD ?? 0);
}

export type IshodPotvrde =
  | { stanje: "UNAPRED"; poen: number }
  | { stanje: "CEKA_FONDACIJU"; razlogBezUnapred: "PRAG" | "PERIOD" | "PLATILAC" | "ANONIMNA" }
  | { stanje: "ODBIJENA"; razlog: "NECITLJIVO" | "IZNOS" | "RACUN" | "POZIV" | "DATUM" | "VEC_KORISCENA" };

/**
 * Donator šalje potvrdu o uplati za svoju najavljenu donaciju (donacije čl. 6 st. 4).
 * Potvrda se čuva u bazi do odluke Fondacije; podaci pročitani iz nje ostaju na zapisu.
 */
export async function prihvatiPotvrdu(
  userId: string,
  donationId: string,
  fajl: { sadrzaj: Buffer; mime: string },
): Promise<IshodPotvrde> {
  if (!(DOZVOLJENI_TIPOVI_POTVRDE as readonly string[]).includes(fajl.mime))
    throw new DonacijaUnapredGreska("Potvrda mora biti PDF ili slika (JPG, PNG, WebP).");
  if (fajl.sadrzaj.length === 0 || fajl.sadrzaj.length > MAX_POTVRDA_BAJTOVA)
    throw new DonacijaUnapredGreska("Potvrda je prevelika ili prazna.");

  const d = await prisma.donationRecord.findUnique({
    where: { id: donationId },
    select: {
      id: true, userId: true, status: true, javno: true, amountRSD: true, pozivBroj: true,
      referenceNumber: true, createdAt: true, potvrdaPoslataAt: true,
      user: { select: { maloletan: true, podaci: { select: { punoIme: true } } } },
    },
  });
  if (!d || d.userId !== userId) throw new DonacijaUnapredGreska("Donacija nije pronađena.", 404);
  if (d.user.maloletan) throw new DonacijaUnapredGreska("Maloletni korisnik ne donira.", 403);
  if (d.status !== DonationStatus.PENDING) throw new DonacijaUnapredGreska("Za ovu donaciju potvrda više ne može da se pošalje.", 409);

  const hash = hashPotvrde(fajl.sadrzaj);
  // Jedna potvrda, jedna uplata (čl. 6 st. 4) — i preko donacija i preko prijava pokroviteljstva.
  const [vecD, vecP] = await Promise.all([
    prisma.donationRecord.findFirst({ where: { potvrdaHash: hash, id: { not: d.id } }, select: { id: true } }),
    prisma.pokroviteljPrijava.findFirst({ where: { potvrdaHash: hash }, select: { id: true } }),
  ]);
  if (vecD || vecP) return { stanje: "ODBIJENA", razlog: "VEC_KORISCENA" };

  // Ime iz evidencije identiteta služi SAMO poređenju sa platiocem na potvrdi (čl. 6 st. 1);
  // ne prikazuje se i ne ide u opis, obaveštenje ni audit (Pravilnik čl. 31).
  const imeDonatora = (await imeNaloga(userId)) ?? d.user.podaci?.punoIme?.trim() ?? null;
  const iznos = Number(d.amountRSD);
  const tekst = await procitajPotvrdu(fajl.sadrzaj, fajl.mime);
  const ishod = uporediPotvrdu(tekst, {
    iznosRSD: iznos,
    racun: racunFondacije(),
    pozivNaBroj: d.referenceNumber ?? pozivNaBrojZaDonaciju(d.pozivBroj),
    imeDonatora,
    najranije: d.createdAt,
  });
  if (!ishod.ok) return { stanje: "ODBIJENA", razlog: ishod.razlog };

  const sada = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.potvrdaUplate.deleteMany({ where: { donationId: d.id } });
    await tx.potvrdaUplate.create({
      data: { donationId: d.id, sadrzaj: new Uint8Array(fajl.sadrzaj), mime: fajl.mime, velicina: fajl.sadrzaj.length },
    });
    await tx.donationRecord.update({
      where: { id: d.id },
      data: {
        potvrdaPoslataAt: sada,
        potvrdaHash: hash,
        potvrdaIznosRSD: ishod.procitano.iznosRSD,
        potvrdaDatum: ishod.procitano.datum,
        potvrdaRacun: ishod.procitano.racun,
        potvrdaPoziv: ishod.procitano.pozivNaBroj,
        potvrdaPlatilac: ishod.procitano.platilac,
      },
    });
  });

  // Da li ide unapred (čl. 6 st. 5).
  if (!d.javno) return { stanje: "CEKA_FONDACIJU", razlogBezUnapred: "ANONIMNA" };
  const [ukupno, uPeriodu] = await Promise.all([
    utvrdjenoUkupno(userId),
    prisma.donationRecord.count({
      where: { userId, unapred: true, evidentiranoUnapredAt: { gte: pocetakObracunskogDana(sada) } },
    }),
  ]);
  if (!smeUnapred({ javno: true, utvrdjenoUkupnoRSD: ukupno, unapredUPeriodu: uPeriodu }))
    return { stanje: "CEKA_FONDACIJU", razlogBezUnapred: uPeriodu > 0 ? "PERIOD" : "PRAG" };
  // Doprinos ide isključivo onome čijim je sredstvima uplata izvršena (čl. 6 st. 1):
  // bez imena donatora na potvrdi nema evidentiranja unapred — čeka se izvod.
  if (!ishod.platilacSePoklapa) return { stanje: "CEKA_FONDACIJU", razlogBezUnapred: "PLATILAC" };

  const poen = await evidentirajUnapred(d.id, userId, ukupno, iznos);
  return { stanje: "UNAPRED", poen };
}

/**
 * Potvrda o uplati novčanog pokroviteljstva (donacije čl. 20 st. 2, set 5.0.9). Čita se i
 * poredi kao kod donacije, ali se NIŠTA ne evidentira unapred (čl. 20 st. 3): prijem
 * utvrđuje Fondacija, a doprinos se evidentira u narednom obračunskom periodu. Ime
 * platioca se ne poredi — plaća pokrovitelj sa svog računa.
 */
export async function prihvatiPotvrduPrijave(
  userId: string,
  prijavaId: string,
  fajl: { sadrzaj: Buffer; mime: string },
): Promise<{ stanje: "CEKA_FONDACIJU" } | { stanje: "ODBIJENA"; razlog: "NECITLJIVO" | "IZNOS" | "RACUN" | "POZIV" | "DATUM" | "VEC_KORISCENA" }> {
  if (!(DOZVOLJENI_TIPOVI_POTVRDE as readonly string[]).includes(fajl.mime))
    throw new DonacijaUnapredGreska("Potvrda mora biti PDF ili slika (JPG, PNG, WebP).");
  if (fajl.sadrzaj.length === 0 || fajl.sadrzaj.length > MAX_POTVRDA_BAJTOVA)
    throw new DonacijaUnapredGreska("Potvrda je prevelika ili prazna.");
  const p = await prisma.pokroviteljPrijava.findUnique({
    where: { id: prijavaId },
    select: { id: true, podnosilacId: true, status: true, vrstaDonacije: true, vrednostRsd: true, pozivBroj: true, potpisanoAt: true, createdAt: true },
  });
  if (!p || p.podnosilacId !== userId) throw new DonacijaUnapredGreska("Prijava nije pronađena.", 404);
  if (p.vrstaDonacije !== "NOVAC" || p.status !== "POTPISANA")
    throw new DonacijaUnapredGreska("Potvrda se šalje za potpisanu prijavu novčanog pokroviteljstva.", 409);
  const hash = hashPotvrde(fajl.sadrzaj);
  const [vecD, vecP] = await Promise.all([
    prisma.donationRecord.findFirst({ where: { potvrdaHash: hash }, select: { id: true } }),
    prisma.pokroviteljPrijava.findFirst({ where: { potvrdaHash: hash, id: { not: p.id } }, select: { id: true } }),
  ]);
  if (vecD || vecP) return { stanje: "ODBIJENA", razlog: "VEC_KORISCENA" };
  const tekst = await procitajPotvrdu(fajl.sadrzaj, fajl.mime);
  const ishod = uporediPotvrdu(tekst, {
    iznosRSD: Number(p.vrednostRsd),
    racun: racunFondacije(),
    pozivNaBroj: pozivNaBrojZaPrijavu(p.pozivBroj),
    imeDonatora: null,
    najranije: p.potpisanoAt ?? p.createdAt,
  });
  if (!ishod.ok) return { stanje: "ODBIJENA", razlog: ishod.razlog };
  await prisma.$transaction(async (tx) => {
    await tx.potvrdaUplate.deleteMany({ where: { prijavaId: p.id } });
    await tx.potvrdaUplate.create({
      data: { prijavaId: p.id, sadrzaj: new Uint8Array(fajl.sadrzaj), mime: fajl.mime, velicina: fajl.sadrzaj.length },
    });
    await tx.pokroviteljPrijava.update({
      where: { id: p.id },
      data: {
        potvrdaPoslataAt: new Date(),
        potvrdaHash: hash,
        potvrdaIznosRSD: ishod.procitano.iznosRSD,
        potvrdaDatum: ishod.procitano.datum,
        potvrdaRacun: ishod.procitano.racun,
        potvrdaPoziv: ishod.procitano.pozivNaBroj,
      },
    });
  });
  return { stanje: "CEKA_FONDACIJU" };
}

/** Evidentiranje donacije unapred (čl. 6 st. 5). DB u transakciji, emisija posle (pravilo 8). */
async function evidentirajUnapred(donationId: string, userId: string, utvrdjeno: number, iznos: number): Promise<number> {
  const izracun = izracunajPoenZaDonaciju(utvrdjeno, iznos);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { wallet: { select: { id: true } }, podaci: { select: { punoIme: true } } },
  });
  if (!user.wallet) throw new DonacijaUnapredGreska("Korisnik nema zapis u Protokolu.");
  const sada = new Date();
  // Brava: samo PENDING prelazi u NA_PROVERI, pa dvostruko slanje ne emituje dvaput.
  const preuzeto = await prisma.donationRecord.updateMany({
    where: { id: donationId, status: DonationStatus.PENDING },
    data: {
      status: DonationStatus.NA_PROVERI,
      unapred: true,
      evidentiranoUnapredAt: sada,
      poenEmitted: izracun.poen,
      level: izracun.noviNivo,
      cumulativeRSD: izracun.noviKumulativ,
      donatorIme: user.podaci?.punoIme?.trim() || null,
    },
  });
  if (preuzeto.count !== 1) return 0;
  try {
    if (izracun.poen > 0)
      await emitujPoen(
        user.wallet.id,
        izracun.poen,
        TransactionType.EMISIJA_DONACIJA,
        `Evidentiran doprinos po donaciji unapred: ${izracun.poen.toLocaleString("sr-RS")} POEN`,
        { kljuc: "transakcije.donacija_unapred", parametri: { iznos: izracun.poen } },
      );
  } catch (e) {
    await prisma.donationRecord.update({
      where: { id: donationId },
      data: { status: DonationStatus.PENDING, unapred: false, evidentiranoUnapredAt: null, poenEmitted: 0 },
    });
    throw e;
  }
  await obavesti(userId, {
    tip: "donacija_unapred",
    kljuc: "notifikacije.donacija_unapred",
    parametri: { iznos: izracun.poen },
    naslov: "Doprinos je evidentiran unapred",
    tekst: `Evidentirano ti je ${izracun.poen.toLocaleString("sr-RS")} POEN unapred. Fondacija u roku od 24 časa proverava da li je uplata stigla; ako ne stigne, evidentiranje se poništava.`,
    link: "/donacije",
  }).catch(() => {});
  await probajEvidentiratiPotvrde(userId);
  return izracun.poen;
}

// ─── Odluke Fondacije ───────────────────────────────────────────────────────

/** Fondacija utvrđuje prijem donacije unapred (čl. 6 st. 6). Ugovor se sačinjava sada (čl. 14). */
export async function utvrdiPrijemUnapred(adminId: string, donationId: string, uplatilacUnos: string) {
  const uplatilac = uplatilacUnos.trim();
  if (uplatilac.length < 2) throw new DonacijaUnapredGreska("Unesite ime uplatioca iz izvoda.");
  const d = await prisma.donationRecord.findUnique({
    where: { id: donationId },
    include: { user: { select: { id: true, pseudonim: true, maloletan: true } } },
  });
  if (!d) throw new DonacijaUnapredGreska("Donacija nije pronađena.", 404);
  if (d.status !== DonationStatus.NA_PROVERI) throw new DonacijaUnapredGreska("Donacija nije na proveri.", 409);

  const sada = new Date();
  const ugovorTekst = generisiUgovorODonaciji({
    ime: d.donatorIme,
    pseudonim: d.user.pseudonim,
    iznosRSD: Number(d.amountRSD),
    javno: d.javno,
    zapisId: d.id,
    datum: sada,
    uplatilac,
  });
  const promena = await prisma.$transaction(async (tx) => {
    const r = await tx.donationRecord.updateMany({
      where: { id: d.id, status: DonationStatus.NA_PROVERI },
      data: {
        status: DonationStatus.CONFIRMED,
        confirmedAt: sada,
        confirmedById: adminId,
        uplatilac,
        uplatilacKljuc: normalizujUplatioca(uplatilac),
        ugovorTekst,
      },
    });
    if (r.count === 1) await tx.potvrdaUplate.deleteMany({ where: { donationId: d.id } });
    return r.count;
  });
  if (promena !== 1) throw new DonacijaUnapredGreska("Donacija je u međuvremenu obrađena.", 409);

  await logAdminAkcija(adminId, "DONACIJA_UNAPRED_UTVRDJENA", d.userId, JSON.stringify({ donationId: d.id }));
  // Evidencija identiteta i ponuda spiska idu isto kao kod svake donacije (čl. 13, čl. 3 st. 2).
  if (d.javno && !d.user.maloletan && istoIme(d.donatorIme, uplatilac)) {
    const ime = procitajImePrezime(d.donatorIme);
    if (ime.ok) await upisiIdentitet(d.userId, ime.imePrezime, "DONACIJA").catch(() => {});
  }
  if (
    donacijaVodiNaSpisak({
      javno: d.javno,
      iznosRsd: Number(d.amountRSD),
      imeSePoklapa: istoIme(d.donatorIme, uplatilac),
      uplatilacJedinstven: false,
      maloletan: d.user.maloletan,
    })
  )
    await ponudiSpisak(d.userId, "DONACIJA");
  await obavesti(d.userId, {
    tip: "donacija_unapred_utvrdjena",
    kljuc: "notifikacije.donacija_unapred_utvrdjena",
    parametri: {},
    naslov: "Uplata je stigla",
    tekst: "Fondacija je utvrdila da je tvoja uplata stigla. Donacija je potvrđena.",
    link: "/donacije",
  }).catch(() => {});
}

/**
 * Fondacija poništava donaciju unapred (čl. 6 st. 6–7). `sumnja` — postoji osnov sumnje da
 * je potvrda lažna ili tuđa: tada se ograničava ono što je donator prepisao drugima.
 */
export async function ponistiUnapred(
  adminId: string,
  donationId: string,
  p: { razlog: string; sumnja: boolean },
): Promise<{ ponisteno: number; ogranicenja: number }> {
  const razlog = p.razlog.trim();
  if (razlog.length < 5) throw new DonacijaUnapredGreska("Razlog poništenja je obavezan.");
  const d = await prisma.donationRecord.findUnique({
    where: { id: donationId },
    include: { user: { select: { id: true, pseudonim: true, wallet: { select: { id: true } } } } },
  });
  if (!d) throw new DonacijaUnapredGreska("Donacija nije pronađena.", 404);
  if (d.status !== DonationStatus.NA_PROVERI) throw new DonacijaUnapredGreska("Poništava se samo donacija unapred koja je na proveri.", 409);
  const walletId = d.user.wallet?.id;
  if (!walletId) throw new DonacijaUnapredGreska("Donator nema zapis u Protokolu.", 409);
  const od = d.evidentiranoUnapredAt ?? d.createdAt;
  const sada = new Date();

  const rezultat = await prisma.$transaction(async (tx) => {
    const r = await tx.donationRecord.updateMany({
      where: { id: d.id, status: DonationStatus.NA_PROVERI },
      data: { status: DonationStatus.PONISTENO, ponistenoAt: sada, ponistenoById: adminId, ponistenoRazlog: razlog, sumnjaLaznaPotvrda: p.sumnja },
    });
    if (r.count !== 1) throw new DonacijaUnapredGreska("Donacija je u međuvremenu obrađena.", 409);
    // Ceo doprinos po toj donaciji, i u minus (Pravilnik čl. 17 st. 2 t. 10).
    if (d.poenEmitted > 0)
      await uProtokol(
        tx, walletId, d.poenEmitted, TransactionType.PONISTENJE_DONACIJE,
        "Poništenje donacije unapred — prijem nije utvrđen",
        "transakcije.donacija_unapred_ponistena",
      );
    await tx.potvrdaUplate.deleteMany({ where: { donationId: d.id } });

    const ogr: { userId: string; iznos: number; primljeno: number }[] = [];
    if (p.sumnja) {
      // Samo prepisi OD donatora posle evidentiranja unapred (čl. 6 st. 7) — ništa šire.
      const prepisi = await tx.transaction.groupBy({
        by: ["toWalletId"],
        where: { fromWalletId: walletId, type: TransactionType.TRANSFER, createdAt: { gte: od, lte: sada } },
        _sum: { amount: true },
      });
      for (const pr of prepisi) {
        if (!pr.toWalletId || pr.toWalletId === PROTOKOL_WALLET_ID) continue;
        const primljeno = pr._sum.amount ?? 0;
        if (primljeno <= 0) continue;
        const w = await tx.wallet.findUnique({ where: { id: pr.toWalletId }, select: { balance: true, userId: true } });
        if (!w?.userId) continue;
        const iznos = iznosOgranicenja(primljeno, w.balance);
        await tx.ogranicenjePrimljenog.create({
          data: { donationId: d.id, userId: w.userId, walletId: pr.toWalletId, primljeno, iznos, rokDo: rokOgranicenja(sada) },
        });
        ogr.push({ userId: w.userId, iznos, primljeno });
      }
    }
    return ogr;
  });

  await logAdminAkcija(adminId, "DONACIJA_UNAPRED_PONISTENA", d.userId, JSON.stringify({
    donationId: d.id, poen: d.poenEmitted, sumnja: p.sumnja, ogranicenja: rezultat.length,
  }));

  const stanje = (await prisma.wallet.findUnique({ where: { id: walletId }, select: { balance: true } }))?.balance ?? 0;
  // Minus se nikad ne pojavljuje bez reči (pravilo 3).
  await obavesti(d.userId, {
    tip: "donacija_unapred_ponistena",
    kljuc: stanje < 0 ? "notifikacije.donacija_unapred_ponistena_minus" : "notifikacije.donacija_unapred_ponistena",
    parametri: { iznos: d.poenEmitted, stanje },
    naslov: "Donacija unapred je poništena",
    tekst:
      `Fondacija nije utvrdila da je uplata stigla, pa je poništeno ${d.poenEmitted.toLocaleString("sr-RS")} POEN evidentiranih unapred (Pravilnik o KOLO sistemu čl. 17 st. 2 t. 10).` +
      (stanje < 0 ? ` Tvoj zapis je sada negativan (${stanje.toLocaleString("sr-RS")}); to nije dug i ne naplaćuje se.` : ""),
    link: "/novcanik",
  }).catch(() => {});

  for (const o of rezultat) {
    const poruka = {
      tip: "ogranicenje_primljenog",
      kljuc: "notifikacije.ogranicenje_primljenog",
      parametri: { iznos: o.iznos, dana: 7 },
      naslov: "Deo tvog zapisa je privremeno ograničen",
      tekst: `${o.iznos.toLocaleString("sr-RS")} POEN koje si primio od donatora čija je donacija poništena privremeno ne možeš da prepišeš, iskoristiš ni upišeš u ZRNO, najduže 7 dana, dok Fondacija ne odluči. Na ograničenje možeš da podneseš prigovor.`,
      link: "/novcanik",
    };
    await obavesti(o.userId, poruka).catch(() => {});
    const u = await prisma.user.findUnique({ where: { id: o.userId }, select: { maloletan: true } });
    if (u?.maloletan) await obavestiRoditelje(o.userId, { ...poruka, kljuc: "notifikacije.ogranicenje_primljenog_roditelj", tekst: `Detetu je privremeno ograničeno ${o.iznos.toLocaleString("sr-RS")} POEN primljenih od donatora čija je donacija poništena, najduže 7 dana.` });
  }
  return { ponisteno: d.poenEmitted, ogranicenja: rezultat.length };
}

/**
 * Odluka Fondacije o primaocu (čl. 6 st. 8). `znao` — primalac je znao da je potvrda lažna
 * ili tuđa, odnosno u tome je učestvovao: otpisuje se CEO primljeni iznos, i u minus, i
 * predlaže se isključenje (to izriče superadmin posebno, Uslovi čl. 32 st. 1 t. 9).
 * Inače ograničenje prestaje.
 */
export async function odluciOgranicenje(adminId: string, ogranicenjeId: string, znao: boolean, obrazlozenje: string) {
  if (obrazlozenje.trim().length < 5) throw new DonacijaUnapredGreska("Obrazloženje je obavezno.");
  const o = await prisma.ogranicenjePrimljenog.findUnique({ where: { id: ogranicenjeId } });
  if (!o) throw new DonacijaUnapredGreska("Ograničenje nije pronađeno.", 404);
  if (o.status !== "AKTIVNO") throw new DonacijaUnapredGreska("O ovom ograničenju je već odlučeno.", 409);
  const sada = new Date();
  if (znao && o.rokDo.getTime() <= sada.getTime())
    throw new DonacijaUnapredGreska("Rok od 7 dana je istekao — ograničenje je prestalo i otpis više nije moguć.", 409);

  await prisma.$transaction(async (tx) => {
    const r = await tx.ogranicenjePrimljenog.updateMany({
      where: { id: o.id, status: "AKTIVNO" },
      data: { status: znao ? "OTPISANO" : "PRESTALO", odlukaAt: sada, odlukaById: adminId, otpisano: znao ? o.primljeno : 0 },
    });
    if (r.count !== 1) throw new DonacijaUnapredGreska("O ovom ograničenju je već odlučeno.", 409);
    if (znao && o.primljeno > 0)
      await uProtokol(
        tx, o.walletId, o.primljeno, TransactionType.OTPIS_PRIMLJENOG_DONACIJA,
        "Otpis iznosa primljenog od donatora čija je donacija unapred poništena",
        "transakcije.otpis_primljenog_donacija",
      );
  });
  await logAdminAkcija(adminId, znao ? "OGRANICENJE_OTPIS" : "OGRANICENJE_PRESTALO", o.userId, JSON.stringify({
    ogranicenjeId: o.id, iznos: znao ? o.primljeno : 0, obrazlozenje: obrazlozenje.trim(),
  }));

  const stanje = (await prisma.wallet.findUnique({ where: { id: o.walletId }, select: { balance: true } }))?.balance ?? 0;
  const poruka: Parameters<typeof obavesti>[1] = znao
    ? {
        tip: "ogranicenje_otpis",
        kljuc: stanje < 0 ? "notifikacije.ogranicenje_otpis_minus" : "notifikacije.ogranicenje_otpis",
        parametri: { iznos: o.primljeno, stanje },
        naslov: "Otpis primljenog iznosa",
        tekst:
          `Fondacija je utvrdila da si znao da je potvrda o uplati lažna ili tuđa, pa je otpisano ${o.primljeno.toLocaleString("sr-RS")} POEN primljenih od tog donatora (Pravilnik o KOLO sistemu čl. 17 st. 2 t. 10).` +
          (stanje < 0 ? ` Tvoj zapis je sada negativan (${stanje.toLocaleString("sr-RS")}); to nije dug i ne naplaćuje se.` : "") +
          " Na odluku možeš da podneseš prigovor.",
        link: "/novcanik",
      }
    : {
        tip: "ogranicenje_prestalo",
        kljuc: "notifikacije.ogranicenje_prestalo",
        parametri: { iznos: o.iznos },
        naslov: "Ograničenje je prestalo",
        tekst: `Ograničenje ${o.iznos.toLocaleString("sr-RS")} POEN je prestalo. Ništa ti nije oduzeto.`,
        link: "/novcanik",
      };
  await obavesti(o.userId, poruka).catch(() => {});
  const u = await prisma.user.findUnique({ where: { id: o.userId }, select: { maloletan: true } });
  if (u?.maloletan) await obavestiRoditelje(o.userId, poruka);
}

/** Noćni obračun: ograničenja kojima je istekao rok prestaju i primalac se obaveštava. */
export async function zatvoriIstekla(sada = new Date()): Promise<number> {
  const istekla = await prisma.ogranicenjePrimljenog.findMany({
    where: { status: "AKTIVNO", rokDo: { lte: sada } },
    select: { id: true, userId: true, iznos: true },
  });
  for (const o of istekla) {
    const r = await prisma.ogranicenjePrimljenog.updateMany({ where: { id: o.id, status: "AKTIVNO" }, data: { status: "PRESTALO", odlukaAt: sada } });
    if (r.count === 1)
      await obavesti(o.userId, {
        tip: "ogranicenje_prestalo",
        kljuc: "notifikacije.ogranicenje_prestalo",
        parametri: { iznos: o.iznos },
        naslov: "Ograničenje je prestalo",
        tekst: `Ograničenje ${o.iznos.toLocaleString("sr-RS")} POEN je prestalo. Ništa ti nije oduzeto.`,
        link: "/novcanik",
      }).catch(() => {});
  }
  return istekla.length;
}
