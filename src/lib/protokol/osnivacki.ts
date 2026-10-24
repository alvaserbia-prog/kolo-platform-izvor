/**
 * Osnivacki doprinos (Pravilnik o osnivackom doprinosu v3.9.1)
 *
 * Pravila:
 * - Gornja granica: 2.400.000 POEN (100 koraka x 24.000)
 * - Korak se aktivira svaki put kad ukupan POEN u sistemu predje prag od 100k
 * - Pragovi: 100.000, 200.000, 300.000, ..., 10.000.000 (poslednji)
 * - Kanal se trajno zatvara na 100. koraku
 *
 * NAPOMENA: Lista osnivaca i udeli se popunjavaju kroz admin interfejs
 * (interni akt Fondacije, cl. 12). Koraci se evidentiraju tek kad je
 * lista osnivaca zakljucana (zbir udela = 1).
 */

import { prisma } from "@/lib/prisma";
import { emitujPoen } from "./emisija";
import { TransactionType } from "@/generated/prisma/client";

const PROTOKOL_WALLET_ID = "banka-singleton";

export const ITERATION_LIMIT = 100;
export const KORAK_IZNOS = 24_000;
export const GORNJA_GRANICA = ITERATION_LIMIT * KORAK_IZNOS; // 2.400.000
export const PRAG_SKOK = 100_000;

/**
 * Raspodela jednog koraka (KORAK_IZNOS) među osnivačima srazmerno udelima (čl. 12).
 * Largest-remainder metoda — zbir vraćenih iznosa je tačno KORAK_IZNOS (bez gubitka
 * na zaokruživanju), pa evidentirani iznos po koraku ostaje konzistentan sa 20.000.
 * Pretpostavka (validirano u pozivaocu): svi udeli imaju isti imenilac, zbir
 * brojilaca = imenilac.
 */
export function raspodeliKorak(udeli: { udeoBrojilac: number; udeoImenilac: number }[]): number[] {
  if (udeli.length === 0) return [];
  const imenilac = udeli[0].udeoImenilac;
  const baze = udeli.map((u) => Math.floor((KORAK_IZNOS * u.udeoBrojilac) / imenilac));
  let ostatak = KORAK_IZNOS - baze.reduce((s, x) => s + x, 0);
  const ostaci = udeli
    .map((u, i) => ({ i, frac: (KORAK_IZNOS * u.udeoBrojilac) % imenilac }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < ostaci.length && ostatak > 0; k++) {
    baze[ostaci[k].i] += 1;
    ostatak--;
  }
  return baze;
}

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
    preostalo: GORNJA_GRANICA - kanal.ukupnoEvidentirano,
    procenatIskoriscenja: Math.round((kanal.ukupnoEvidentirano / GORNJA_GRANICA) * 10000) / 100,
    ukupanPoenUSistemu: ukupanPoen,
    sledeciPrag: kanal.poslednjiPrag + PRAG_SKOK,
    osnivaciZakljucani: kanal.osnivaciZakljucani,
  };
}

/**
 * Provera i evidentiranje koraka.
 * Poziva se rucno (admin) ili iz noćnog cron-a.
 * Vraca koliko koraka je evidentirano u ovom pozivu (moze biti vise od 1 ako je opticaj naglo skocio).
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
      poruka: "Lista osnivača nije zaključana — koraci se ne evidentiraju dok admin ne zaključa osnivače.",
    };
  }

  const osnivaci = await prisma.osnivac.findMany({ orderBy: { redniBroj: "asc" } });
  if (osnivaci.length === 0) {
    return { evidentiranoKoraka: 0, zatvoren: false, poruka: "Nema definisanih osnivaca." };
  }

  // Provera da zbir udela = 1
  const zbirBrojilaca = osnivaci.reduce((s, o) => s + o.udeoBrojilac, 0);
  const imenilac = osnivaci[0].udeoImenilac;
  const sviIstiImenilac = osnivaci.every((o) => o.udeoImenilac === imenilac);
  if (!sviIstiImenilac || zbirBrojilaca !== imenilac) {
    return {
      evidentiranoKoraka: 0,
      zatvoren: false,
      poruka: `Udeli osnivaca nisu validni: zbir = ${zbirBrojilaca}/${imenilac}, mora biti ${imenilac}/${imenilac}.`,
    };
  }

  let trenutniKoraci = kanal.brojKoraka;
  let trenutniPrag = kanal.poslednjiPrag;
  let evidentirano = 0;

  // Snapshot ukupnog POEN-a PRE petlje. Svaki korak emituje KORAK_IZNOS POEN-a i time
  // povećava opticaj; da to NE bi samo guralo prag za sledeći korak (samopojačavajuća
  // kaskada), prag se poredi prema stanju sistema na ulasku, a ne posle svake emisije.
  const ukupanPoen = await izracunajUkupanPoen();

  while (trenutniKoraci < ITERATION_LIMIT) {
    const sledeciPrag = trenutniPrag + PRAG_SKOK;

    if (ukupanPoen < sledeciPrag) break; // jos nije dostignut sledeci prag

    // Evidentiraj korak: kreira KorakLog i emituje POEN svakom osnivacu
    const korakLog = await prisma.osnivackiKorakLog.create({
      data: {
        brojKoraka: trenutniKoraci + 1,
        prag: sledeciPrag,
        ukupanPoenUSistemu: ukupanPoen,
        iznosKoraka: KORAK_IZNOS,
      },
    });

    // Emituj POEN svakom osnivacu prema udelu (zbir = tačno KORAK_IZNOS)
    const iznosi = raspodeliKorak(osnivaci);
    for (let oi = 0; oi < osnivaci.length; oi++) {
      const osnivac = osnivaci[oi];
      const iznos = iznosi[oi];
      if (iznos <= 0) continue;

      const wallet = await prisma.wallet.findUnique({ where: { userId: osnivac.userId } });
      if (!wallet) {
        throw new Error(`Wallet ne postoji za osnivaca ${osnivac.userId}.`);
      }

      const rezultat = await emitujPoen(
        wallet.id,
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
    evidentirano += 1;
  }

  // Update singleton kanala
  const zatvoren = trenutniKoraci >= ITERATION_LIMIT;
  await prisma.osnivackiKanal.update({
    where: { id: "singleton" },
    data: {
      brojKoraka: trenutniKoraci,
      poslednjiPrag: trenutniPrag,
      ukupnoEvidentirano: trenutniKoraci * KORAK_IZNOS,
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
