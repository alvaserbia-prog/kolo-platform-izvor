import { prisma } from "@/lib/prisma";
import { danObracuna, prethodniDan } from "./obracunski-dan";
import { proveriZbir, snimiZbir } from "./zbir-zapisa";
import { TransactionType } from "@/generated/prisma/client";
import {
  IZBOR_STATUSA,
  preracunajStatusNaloga,
  posledicePromeneStatusa,
  statusUcesnika,
  type PromenaStatusa,
} from "./status";
import {
  glasackaMoc,
  razresiGlasackuMoc,
  smeAktiviratiZrno,
  smeOtpisatiZrno,
  smeUpisatiZrno,
} from "@/lib/gornje-kolo-pravila";

// Čista pravila ZRNA i Gornjeg Kola (set 4.8.2) — jedan ulaz za server (pravilo 9).
export * from "@/lib/gornje-kolo-pravila";
import { najviseZaUpisZrna, upisZrnaOtvoren } from "@/lib/zrno-upis-pravila";
export * from "@/lib/zrno-upis-pravila";

export const UKUPNO_ZRNA = 1_000_000;
export const PROTOKOL_WALLET_ID = "banka-singleton";

// Pravilnik čl. 22 st. 4: upis ZRNA pretpostavlja minimum od 20.000 evidentiranih POEN-a
export const MINIMUM_POEN_ZA_UPIS_ZRNA = 20_000;

// ── Računanje ─────────────────────────────────────────────────────────────────
// `glasackaMoc` i `razresiGlasackuMoc` žive u `gornje-kolo-pravila.ts`.

/**
 * Tekući obračunski koeficijent (Pravilnik čl. 25): odnos ukupnog broja
 * evidentiranih POEN-a i broja ZRNA raspoloživih za upis u Protokolu.
 *
 * 🔴 Funkcija se do 13.09.2026. zvala `trendsKurs`, a promenljive `kurs` —
 * uklonjeno uz R-04. Čl. 25 st. 4: koeficijent „nije cena, nije kurs i nije
 * indeks performansi". Ne vraćati reč „kurs" ni u jedan identifikator ni u
 * ijedan opis transakcije.
 *
 * 🟢 Upis i otpis ZRNA su po konstrukciji NEUTRALNI za koeficijent: pri upisu
 * se istovremeno umanjuju brojilac (POEN odlazi Protokolu i izlazi iz opticaja)
 * i imenilac (raspoloživa ZRNA), pa količnik ostaje isti — (T−Z·k)/(R−Z) = k.
 * Koeficijent pomeraju SAMO emisije POEN-a (naviše) i poništenja POEN-a
 * (naniže). To je nosiv argument protiv čitanja ZRNA kao instrumenta: nosilac
 * sopstvenim potezom koeficijent ne pomera, pa nema ni trgovanja ni tajminga.
 */
export async function tekuciKoeficijent(): Promise<number> {
  // koeficijent = |protokol_balance| / zrnaUProtokolu
  const protokol = await prisma.wallet.findUnique({
    where: { id: PROTOKOL_WALLET_ID },
    select: { balance: true },
  });
  const protokolBalance = Math.abs(protokol?.balance ?? 0);
  if (protokolBalance === 0) return 1;

  const ukupnoKodKorisnika = await prisma.zrnoStanje.aggregate({
    _sum: { slobodno: true, aktivno: true },
  });
  const kodKorisnika = (ukupnoKodKorisnika._sum.slobodno ?? 0) + (ukupnoKodKorisnika._sum.aktivno ?? 0);
  const zrnaUProtokolu = UKUPNO_ZRNA - kodKorisnika;
  if (zrnaUProtokolu <= 0) return protokolBalance; // edge case

  // Zaokruženo na 2 decimale radi doslednosti sa naplatom (V5).
  return Math.max(0.01, Number((protokolBalance / zrnaUProtokolu).toFixed(2)));
}

export async function poslednjiKoeficijent(): Promise<number> {
  const snimak = await prisma.zrnoDnevniKoeficijent.findFirst({ orderBy: { date: "desc" } });
  if (snimak) return Number(snimak.koeficijent);
  return await tekuciKoeficijent();
}

// ── Noćna obrada ZRNO operacija ───────────────────────────────────────────────

export async function izvrsiZrnoOperacije(datum: Date) {
  // Obračunski dan po srpskom vremenu koji ovaj prolaz OTVARA (koeficijent/brava dana).
  const danas = danObracuna(datum);
  // Zahtevi se izvršavaju „u ponoć istog obračunskog perioda": prolaz na ponoći
  // obrađuje zahteve podnete zaključno sa danom koji se upravo završio. `lte`
  // (umesto tačnog datuma) pokupi i starije PENDING zahteve koje je raniji
  // raspored crona (00:00 UTC — već „sutrašnji" dan) preskakao po datumu.
  const doDana = prethodniDan(danas);

  // 1. Izračunaj obračunski koeficijent za danas
  const protokol = await prisma.wallet.findUnique({
    where: { id: PROTOKOL_WALLET_ID },
    select: { balance: true },
  });
  const protokolBalance = Math.abs(protokol?.balance ?? 0);

  const ukupnoKodKorisnika = await prisma.zrnoStanje.aggregate({
    _sum: { slobodno: true, aktivno: true },
  });
  const kodKorisnika = (ukupnoKodKorisnika._sum.slobodno ?? 0) + (ukupnoKodKorisnika._sum.aktivno ?? 0);
  const zrnaUProtokolu = UKUPNO_ZRNA - kodKorisnika;
  // V5: koeficijent se zaokružuje na 2 decimale JEDNOM i ta ista vrednost se
  // koristi i za prikaz/čuvanje i za sav obračun — tako je primenjeni koeficijent
  // identičan prikazanom. Klamp na min 0.01 da deljenje `poen/koeficijent` nikad
  // ne pukne (degenerisan sitan koeficijent).
  const koeficijentRaw = protokolBalance > 0 && zrnaUProtokolu > 0 ? protokolBalance / zrnaUProtokolu : 1;
  const koeficijent = Math.max(0.01, Number(koeficijentRaw.toFixed(2)));

  // K4: BRAVA DANA — `create` (ne `upsert`). Ako su ZRNO operacije za ovaj dan već
  // pokrenute (cron retry ili cron + ručni admin okidač), drugi poziv dobije P2002
  // na jedinstvenom `date` i ceo posao se preskače — bez duplog izdavanja ZRNA.
  try {
    await prisma.zrnoDnevniKoeficijent.create({
      data: { date: danas, koeficijent: koeficijent.toFixed(2), protokolMinus: protokolBalance, zrnaUProtokolu: zrnaUProtokolu },
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return { koeficijent, zrnaUProtokolu, obradjenihUpisa: 0, obradjenihOtpisa: 0, preskoceno: true };
    }
    throw e;
  }

  // 2. Obradi upise. Upis je otvoren samo u Fazi 2 (Pravilnik čl. 22 st. 1) — za
  // svakoga, i za osnivača (osnivački čl. 9): zahtev koji bi se zatekao van Faze 2
  // se ne izvršava.
  const fazaUpisa = upisZrnaOtvoren(await prisma.zrnoKanal.findUnique({ where: { id: "singleton" } }));
  const upisi = await prisma.zrnoUpisZahtev.findMany({
    where: { date: { lte: doDana }, status: "PENDING" },
    include: { user: { include: { wallet: true, zrnoStanje: true } } },
  });

  // K3: brojač ZRNA izdatih u OVOM prolazu. Bez njega svaki upis čita istu staru
  // "slobodno" cifru, pa zbir izdatih može da pređe UKUPNO_ZRNA (1.000.000).
  let izdato = 0;

  for (const z of upisi) {
    try {
      if (!fazaUpisa) { await cancel(z.id, "upis"); continue; }
      if (!z.user.wallet) { await cancel(z.id, "upis"); continue; }
      // Set 4.8.2: status se proverava i pri izvršenju — korisnik (kome je u
      // međuvremenu pala verifikacija) i dete ZRNO ne upisuju (Pravilnik čl. 22 st. 3, čl. 52 st. 2).
      if (!smeUpisatiZrno(statusUcesnika(z.user))) { await cancel(z.id, "upis"); continue; }
      const walletBalance = z.user.wallet.balance;

      // Proveri minimalni balans
      if (walletBalance < MINIMUM_POEN_ZA_UPIS_ZRNA) { await cancel(z.id, "upis"); continue; }

      // Limit po obračunskom periodu (čl. 22 st. 4; `PROCENAT_UPISA_ZRNA_PO_PERIODU`)
      const maxPoen = najviseZaUpisZrna(walletBalance);
      const poenZaTrosak = Math.min(z.poenIznos, maxPoen);

      // Zaokruži
      const zrnaDobija = Math.floor(poenZaTrosak / koeficijent);
      if (zrnaDobija <= 0) { await cancel(z.id, "upis"); continue; }
      const utrosenoPoen = Math.ceil(zrnaDobija * koeficijent);

      // Proveri da ima dovoljno slobodnih ZRNA u Protokolu — UMANJENO za već izdato
      // u ovom prolazu (K3), inače se fiksna ponuda od 1.000.000 može probiti.
      const slobodnoUProtokolu = UKUPNO_ZRNA - kodKorisnika - izdato;
      if (zrnaDobija > slobodnoUProtokolu) { await cancel(z.id, "upis"); continue; }

      const promena = await prisma.$transaction(async (tx) => {
        // Pravilo 1: provera zbira po novčaniku i zero-sum u istoj transakciji.
        const snimak = await snimiZbir(tx, [z.user.wallet!.id]);
        // POEN: user → Protokol (reverse emission)
        await tx.wallet.update({ where: { id: z.user.wallet!.id }, data: { balance: { decrement: utrosenoPoen } } });
        await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: utrosenoPoen } } });
        await tx.transaction.create({ data: {
          fromWalletId: z.user.wallet!.id,
          toWalletId: PROTOKOL_WALLET_ID,
          amount: utrosenoPoen,
          type: TransactionType.UPIS_ZRNO,
          description: `Upis ${zrnaDobija} ZRNA po koeficijentu ${koeficijent.toFixed(2)}`,
          opisKljuc: "transakcije.zrno_upis",
          opisParametri: { zrna: zrnaDobija, koeficijent: koeficijent.toFixed(2) },
        }});

        // ZRNO: Protokol → user
        await tx.zrnoStanje.upsert({
          where: { userId: z.userId },
          create: { userId: z.userId, slobodno: zrnaDobija, aktivno: 0 },
          update: { slobodno: { increment: zrnaDobija } },
        });

        // Pravilnik čl. 22 st. 2–3, čl. 28 st. 3: član Kola upisom ZRNA postaje čuvar
        // Kola; član bez potvrde upisom NE postaje čuvar (ostaje REGULARNI) i
        // ZRNO ne aktivira dok ne bude potvrđen (čl. 28 st. 3). Status piše samo
        // `preracunajStatusNaloga` (set 4.8.2) — ovde nema direktnog upisa
        // `tipKorisnika`.
        const p = await preracunajStatusNaloga(tx, z.userId);

        await tx.zrnoUpisZahtev.update({
          where: { id: z.id },
          data: { status: "EXECUTED", zrnaUpisana: zrnaDobija, utrosenoPoen },
        });
        await proveriZbir(tx, snimak, "Upis ZRNA");
        return p;
      });
      // Tek po uspešnoj transakciji uvećaj brojač izdatih ZRNA (K3).
      izdato += zrnaDobija;
      await posledice(z.userId, promena);
    } catch (err) {
      console.error(`Greška pri upisu ZRNA za ${z.userId}:`, err);
      await cancel(z.id, "upis");
    }
  }

  // 3. Obradi otpise
  const otpisi = await prisma.zrnoOtpisZahtev.findMany({
    where: { date: { lte: doDana }, status: "PENDING" },
    include: { user: { include: { wallet: true, zrnoStanje: true } } },
  });

  for (const z of otpisi) {
    try {
      if (!z.user.wallet || !z.user.zrnoStanje) { await cancel(z.id, "otpis"); continue; }
      // Korisniku je ZRNO zamrznuto — ne otpisuje ga (Pravilnik čl. 29 st. 1).
      if (!smeOtpisatiZrno(statusUcesnika(z.user))) { await cancel(z.id, "otpis"); continue; }
      if (z.user.zrnoStanje.slobodno < z.kolicina) { await cancel(z.id, "otpis"); continue; }

      const evidentiranoPoen = Math.floor(z.kolicina * koeficijent);
      if (evidentiranoPoen <= 0) { await cancel(z.id, "otpis"); continue; }

      const promena = await prisma.$transaction(async (tx) => {
        // Pravilo 1: provera zbira po novčaniku i zero-sum u istoj transakciji.
        const snimak = await snimiZbir(tx, [z.user.wallet!.id]);
        // POEN: Protokol → user
        await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { decrement: evidentiranoPoen } } });
        await tx.wallet.update({ where: { id: z.user.wallet!.id }, data: { balance: { increment: evidentiranoPoen } } });
        await tx.transaction.create({ data: {
          fromWalletId: PROTOKOL_WALLET_ID,
          toWalletId: z.user.wallet!.id,
          amount: evidentiranoPoen,
          type: TransactionType.OTPIS_ZRNO,
          description: `Otpis ${z.kolicina} ZRNA po koeficijentu ${koeficijent.toFixed(2)}`,
          opisKljuc: "transakcije.zrno_otpis",
          opisParametri: { zrna: z.kolicina, koeficijent: koeficijent.toFixed(2) },
        }});

        // ZRNO: user → Protokol
        await tx.zrnoStanje.update({
          where: { userId: z.userId },
          data: { slobodno: { decrement: z.kolicina } },
        });

        // Pravilnik čl. 23 st. 3: čuvar Kola čije je ZRNO u celosti
        // otpisano postaje član Kola — kroz `preracunajStatusNaloga` (set 4.8.2).
        const p = await preracunajStatusNaloga(tx, z.userId);

        await tx.zrnoOtpisZahtev.update({
          where: { id: z.id },
          data: { status: "EXECUTED", evidentiranoPoen },
        });
        await proveriZbir(tx, snimak, "Otpis ZRNA");
        return p;
      });
      await posledice(z.userId, promena);
    } catch (err) {
      console.error(`Greška pri otpisu ZRNA za ${z.userId}:`, err);
      await cancel(z.id, "otpis");
    }
  }

  // 4. Obradi promene statusa
  const statusZahtevi = await prisma.zrnoStatusZahtev.findMany({
    where: { date: { lte: doDana }, status: "PENDING" },
    include: { user: { include: { zrnoStanje: true } } },
  });

  for (const z of statusZahtevi) {
    try {
      if (!z.user.zrnoStanje) { await cancelStatus(z.id); continue; }
      const st = z.user.zrnoStanje;

      if (z.akcija === "ZAKLJUCAJ") {
        // Aktivira samo čuvar Kola u trenutku izvršenja (Pravilnik čl. 23 st. 2,
        // 28 st. 3, 29): član bez potvrde, korisnik kome je ZRNO zamrznuto
        // i čuvar kome je u međuvremenu pala potvrda — odbija se.
        if (!smeAktiviratiZrno(statusUcesnika(z.user))) { await cancelStatus(z.id); continue; }
        if (st.slobodno < z.kolicina) { await cancelStatus(z.id); continue; }
        await prisma.zrnoStanje.update({
          where: { userId: z.userId },
          data: { slobodno: { decrement: z.kolicina }, aktivno: { increment: z.kolicina } },
        });
      } else {
        if (st.aktivno < z.kolicina) { await cancelStatus(z.id); continue; }
        await prisma.zrnoStanje.update({
          where: { userId: z.userId },
          data: { aktivno: { decrement: z.kolicina }, slobodno: { increment: z.kolicina } },
        });
      }

      await prisma.zrnoStatusZahtev.update({ where: { id: z.id }, data: { status: "EXECUTED" } });
    } catch (err) {
      console.error(`Greška pri promeni statusa ZRNA za ${z.userId}:`, err);
      await cancelStatus(z.id);
    }
  }

  // 5. Primeni zakazane promene delegiranja (delegacija i opoziv stupaju na snagu u ponoć)
  const zakazane = await prisma.zrnoDelegacija.findMany({ where: { imaZakazano: true } });
  for (const d of zakazane) {
    if (!d.zakazaniDelegatId) {
      // Zakazan opoziv → ukloni delegaciju
      await prisma.zrnoDelegacija.delete({ where: { id: d.id } });
    } else {
      await prisma.zrnoDelegacija.update({
        where: { id: d.id },
        data: { delegatId: d.zakazaniDelegatId, zakazaniDelegatId: null, imaZakazano: false },
      });
    }
  }

  return { koeficijent, zrnaUProtokolu, obradjenihUpisa: upisi.length, obradjenihOtpisa: otpisi.length };
}

async function cancel(id: string, tip: "upis" | "otpis") {
  if (tip === "upis") {
    await prisma.zrnoUpisZahtev.update({ where: { id }, data: { status: "CANCELLED" } });
  } else {
    await prisma.zrnoOtpisZahtev.update({ where: { id }, data: { status: "CANCELLED" } });
  }
}

/** Posledice promene statusa posle upisa/otpisa — van transakcije, ne baca (pravilo 8). */
async function posledice(userId: string, p: PromenaStatusa) {
  try {
    await posledicePromeneStatusa(userId, p.pre, p.posle);
  } catch (e) {
    console.error(`[zrno] posledice promene statusa za ${userId}`, e);
  }
}

async function cancelStatus(id: string) {
  await prisma.zrnoStatusZahtev.update({ where: { id }, data: { status: "CANCELLED" } });
}

// ── Glasačka moć sa delegacijom ───────────────────────────────────────────────

/**
 * Glasačka moć učesnika sa tranzitivnim lancem delegiranja (Gornje Kolo čl. 5,
 * 14, 15). Čisto razrešavanje je `razresiGlasackuMoc` (`gornje-kolo-pravila.ts`).
 *
 * Set 4.8.2: moć ima samo čuvar Kola (u `baza` ulaze samo čuvari), a delegacija
 * čiji delegator ili delegat nije čuvar ne proizvodi dejstvo — moć iz nje se ne
 * računa nikome (Gornje Kolo čl. 4 st. 3, 14 st. 3; Pravilnik čl. 29, 44 st. 2).
 *
 * Računa se nad VAŽEĆIM delegacijama (delegatId != null). Zakazane promene
 * (imaZakazano) stupaju na snagu tek u ponoć i ne utiču na trenutni obračun.
 */
export async function izracunajGlasove(userId: string): Promise<number> {
  const sve = await prisma.zrnoDelegacija.findMany({
    where: { delegatId: { not: null } },
    select: { delegatorId: true, delegatId: true },
  });
  const next = new Map<string, string>();
  for (const d of sve) next.set(d.delegatorId, d.delegatId!);

  if (next.has(userId)) return 0;

  // Kandidati: userId + svi učesnici grafa delegiranja.
  const ids = [...new Set<string>([userId, ...next.keys(), ...next.values()])];
  const [stanja, korisnici] = await Promise.all([
    prisma.zrnoStanje.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, aktivno: true },
    }),
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, ...IZBOR_STATUSA } }),
  ]);
  // `statusUcesnika` bez stanja deteta: dete nikad nije čuvar, pa je dovoljno.
  const cuvari = new Set(
    korisnici.filter((k) => smeAktiviratiZrno(statusUcesnika(k))).map((k) => k.id),
  );
  const baza = new Map<string, number>();
  for (const s of stanja) if (cuvari.has(s.userId)) baza.set(s.userId, glasackaMoc(s.aktivno));

  return razresiGlasackuMoc(next, baza, userId, cuvari);
}
