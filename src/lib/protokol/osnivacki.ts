/**
 * Osnivački doprinos — servisni sloj (Pravilnik o osnivačkom doprinosu; Pravilnik
 * o KOLO sistemu čl. 35). Čista pravila (granica, korak, raspodela, javnost udela)
 * žive u `osnivacki-pravila.ts` i ovde se re-eksportuju (pravilo 9).
 *
 * - Korak se evidentira samo iz noćnog obračuna, na kraju obračunskog perioda
 *   (čl. 6 st. 2–3); ručnog okidača nema.
 * - Osnivači i udeli su iz odluke o raspodeli (čl. 8); u platformu ih upisuje
 *   administrator, a zaključavanjem liste odluka se objavljuje (čl. 8 st. 4) i
 *   krug se više ne menja (čl. 2 st. 3). Koraci se evidentiraju tek nad
 *   zaključanom listom (zbir udela = 1).
 */

import { prisma } from "@/lib/prisma";
import { emitujPoen } from "./emisija";
import { TransactionType } from "@/generated/prisma/client";
import { prestaoStatus } from "@/lib/status-ucesnika-pravila";
import {
  ITERATION_LIMIT,
  GORNJA_GRANICA,
  PRAG_SKOK,
  iznosiKoraka,
  osnivacuJePrestaoStatus,
  preostaloDoGranice,
} from "@/lib/osnivacki-pravila";

export * from "@/lib/osnivacki-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";

/**
 * Ukupan POEN u sistemu = apsolutna vrednost Protokol balansa (jer je zero-sum).
 * Ekvivalentno: suma svih korisnickih + Krug balansa.
 */
export async function izracunajUkupanPoen(): Promise<number> {
  const protokol = await prisma.wallet.findUnique({
    where: { id: PROTOKOL_WALLET_ID },
    select: { balance: true },
  });
  if (!protokol) return 0;
  return Math.abs(protokol.balance);
}

export interface KanalStatus {
  ukupnoEvidentirano: number;
  brojKoraka: number;
  ukupnoKoraka: number;
  zatvoren: boolean;
  zatvorenAt: Date | null;
  poslednjiPrag: number;
  gornjaGranica: number;
  preostalo: number;
  procenatIskoriscenja: number; // 0-100
  ukupanPoenUSistemu: number;
  sledeciPrag: number;
  osnivaciZakljucani: boolean;
}

/**
 * Singleton red kanala. Migracija ga ubacuje, ali baza podignuta bez migracionog
 * SQL-a (db push / ručni reset) ostaje bez njega — zato se ovde kreira po potrebi
 * umesto da se baca izuzetak koji obara status endpoint i admin tab.
 */
export async function dohvatiIliKreirajKanal() {
  return prisma.osnivackiKanal.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function dohvatiStatusKanala(): Promise<KanalStatus> {
  const [kanal, ukupanPoen] = await Promise.all([
    dohvatiIliKreirajKanal(),
    izracunajUkupanPoen(),
  ]);

  return {
    ukupnoEvidentirano: kanal.ukupnoEvidentirano,
    brojKoraka: kanal.brojKoraka,
    ukupnoKoraka: ITERATION_LIMIT,
    zatvoren: kanal.zatvoren,
    zatvorenAt: kanal.zatvorenAt,
    poslednjiPrag: kanal.poslednjiPrag,
    gornjaGranica: GORNJA_GRANICA,
    preostalo: preostaloDoGranice(kanal.ukupnoEvidentirano, kanal.zatvoren),
    procenatIskoriscenja: Math.round((kanal.ukupnoEvidentirano / GORNJA_GRANICA) * 10000) / 100,
    ukupanPoenUSistemu: ukupanPoen,
    sledeciPrag: kanal.poslednjiPrag + PRAG_SKOK,
    osnivaciZakljucani: kanal.osnivaciZakljucani,
  };
}

/**
 * Provera i evidentiranje koraka (čl. 6). Poziva je SAMO noćni obračun, na kraju
 * obračunskog perioda (`/api/cron/nocna-emisija`); 🔴 ručnog okidača nema, jer bi
 * provera usred perioda merila stanje koje nije stanje perioda (čl. 6 st. 2) i bila
 * bi diskreciona (st. 3).
 * Vraća koliko koraka je evidentirano u ovom pozivu (može biti više od 1 ako je
 * ukupan broj POEN-a u periodu dostigao više pragova).
 */
export async function proveriIEvidentirajKorak(): Promise<{
  evidentiranoKoraka: number;
  zatvoren: boolean;
  poruka: string;
}> {
  const kanal = await dohvatiIliKreirajKanal();

  if (kanal.zatvoren) {
    return { evidentiranoKoraka: 0, zatvoren: true, poruka: "Kanal je trajno zatvoren." };
  }

  if (!kanal.osnivaciZakljucani) {
    return {
      evidentiranoKoraka: 0,
      zatvoren: false,
      poruka: "Odluka o raspodeli nije objavljena (lista osnivača nije zaključana) — koraci se ne evidentiraju.",
    };
  }

  const osnivaci = await prisma.osnivac.findMany({
    orderBy: { redniBroj: "asc" },
    include: {
      user: { select: { status: true, deaktiviranAt: true } },
      _count: { select: { emisije: true } },
    },
  });
  if (osnivaci.length === 0) {
    return { evidentiranoKoraka: 0, zatvoren: false, poruka: "Nema definisanih osnivača." };
  }

  // Provera da zbir udela = 1 (čl. 8 st. 1) — nad CELOM odlukom, i sa osnivačima
  // kojima je prestao status: njihov udeo ostaje u imeniocu (čl. 8 st. 3).
  const zbirBrojilaca = osnivaci.reduce((s, o) => s + o.udeoBrojilac, 0);
  const imenilac = osnivaci[0].udeoImenilac;
  const sviIstiImenilac = osnivaci.every((o) => o.udeoImenilac === imenilac);
  if (!sviIstiImenilac || zbirBrojilaca !== imenilac) {
    return {
      evidentiranoKoraka: 0,
      zatvoren: false,
      poruka: `Udeli osnivača nisu validni: zbir = ${zbirBrojilaca}/${imenilac}, mora biti ${imenilac}/${imenilac}.`,
    };
  }

  // Čl. 8 st. 3: udeo osnivača kome je prestao status korisnika (isključen ili
  // ugašen nalog, `prestaoStatus`) se od tada ne evidentira i ne raspoređuje na druge.
  // 🔴 Takav nalog ne sme da zaustavi kanal — on se samo preskače.
  const saStatusom = osnivaci.map((o) => ({
    ...o,
    prestao: osnivacuJePrestaoStatus({
      prestaoSada: o.user ? prestaoStatus(o.user) : true,
      brojEmisija: o._count?.emisije,
      brojKorakaKanala: kanal.brojKoraka,
    }),
  }));
  const iznosi = iznosiKoraka(saStatusom);

  // Novčanici onih kojima se korak upisuje traže se PRE prvog koraka: ako nekome
  // ko ima status novčanik nedostaje (kvar podataka, ne prestanak statusa), provera
  // se prekida pre ijednog upisa, pa se pragovi nadoknađuju sledećom proverom —
  // umesto da njegov udeo nestane ili da korak ostane upisan napola.
  const novcanici = new Map<string, string>();
  for (let oi = 0; oi < saStatusom.length; oi++) {
    if (iznosi[oi] <= 0) continue;
    const wallet = await prisma.wallet.findUnique({ where: { userId: saStatusom[oi].userId } });
    if (!wallet) {
      return {
        evidentiranoKoraka: 0,
        zatvoren: false,
        poruka: `Novčanik ne postoji za osnivača br. ${saStatusom[oi].redniBroj}; korak nije evidentiran.`,
      };
    }
    novcanici.set(saStatusom[oi].id, wallet.id);
  }
  const iznosJednogKoraka = iznosi.reduce((s, x) => s + x, 0);

  let trenutniKoraci = kanal.brojKoraka;
  let trenutniPrag = kanal.poslednjiPrag;
  let ukupnoEvidentirano = kanal.ukupnoEvidentirano;
  let evidentirano = 0;

  // Snimak ukupnog POEN-a PRE petlje (čl. 6 st. 4): koraci evidentirani pri jednoj
  // proveri ne računaju se u ukupan broj prema kome se pri toj istoj proveri
  // utvrđuje dostizanje praga — inače bi se kanal sam pojačavao.
  const ukupanPoen = await izracunajUkupanPoen();

  while (trenutniKoraci < ITERATION_LIMIT) {
    const sledeciPrag = trenutniPrag + PRAG_SKOK;

    if (ukupanPoen < sledeciPrag) break; // još nije dostignut sledeći prag

    // Korak se beleži i kad je umanjen (čl. 8 st. 3) — i kad su svim osnivačima
    // prestali statusi, jer se kanal ne zaustavlja i pragovi se ne pomeraju.
    const korakLog = await prisma.osnivackiKorakLog.create({
      data: {
        brojKoraka: trenutniKoraci + 1,
        prag: sledeciPrag,
        ukupanPoenUSistemu: ukupanPoen,
        iznosKoraka: iznosJednogKoraka,
      },
    });

    for (let oi = 0; oi < saStatusom.length; oi++) {
      const osnivac = saStatusom[oi];
      const iznos = iznosi[oi];
      if (iznos <= 0) continue;

      const rezultat = await emitujPoen(
        novcanici.get(osnivac.id)!,
        iznos,
        TransactionType.EMISIJA_OSNIVACKI,
        `Osnivacki doprinos — korak ${trenutniKoraci + 1}/${ITERATION_LIMIT}`, { kljuc: "transakcije.osnivacki", parametri: { korak: trenutniKoraci + 1, ukupno: ITERATION_LIMIT } },
      );

      await prisma.osnivackiKorakEmisija.create({
        data: {
          korakLogId: korakLog.id,
          osnivacId: osnivac.id,
          iznosPoen: iznos,
          transactionId: rezultat.transaction.id,
        },
      });
    }

    trenutniKoraci += 1;
    trenutniPrag = sledeciPrag;
    ukupnoEvidentirano += iznosJednogKoraka;
    evidentirano += 1;
  }

  // Čl. 10 st. 1: kanal se zatvara 100. korakom, i kad su koraci bili umanjeni.
  const zatvoren = trenutniKoraci >= ITERATION_LIMIT;
  await prisma.osnivackiKanal.update({
    where: { id: "singleton" },
    data: {
      brojKoraka: trenutniKoraci,
      poslednjiPrag: trenutniPrag,
      ukupnoEvidentirano,
      zatvoren,
      zatvorenAt: zatvoren ? new Date() : undefined,
    },
  });

  return {
    evidentiranoKoraka: evidentirano,
    zatvoren,
    poruka: evidentirano > 0
      ? `Evidentirano ${evidentirano} korak(a). Trenutni broj koraka: ${trenutniKoraci}/${ITERATION_LIMIT}.`
      : "Nije dostignut nijedan novi prag.",
  };
}
