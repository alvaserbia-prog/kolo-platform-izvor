/**
 * Dokaz pristanka — upis, opoziv i pregled (R-06, set 4.6.3).
 *
 * Servisne funkcije; čista pravila i tekstovi su u `src/lib/pristanak.ts`, odakle
 * se re-eksportuju da server ima jedan ulaz.
 */
import type { Prisma, PrismaClient, VrstaPristanka } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  pristanciPriRegistraciji,
  tekstPristankaNaKolacice,
  type IzvorPristanka,
  type StavkaPristanka,
} from "@/lib/pristanak";

export * from "@/lib/pristanak";

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Upisuje pristanke dobijene pri otvaranju naloga.
 *
 * 🔴 Zove se ISKLJUČIVO unutar iste transakcije u kojoj nastaje nalog. Nalog bez
 * zapisa pristanka je tačno stanje koje R-06 uklanja; da upis ide posle
 * transakcije, pad između to stanje bi vratio — i to tiho, jer bi registracija
 * korisniku i dalje vratila uspeh.
 */
export async function upisiPristankeRegistracije(
  tx: Tx,
  userId: string,
  jezik: string,
  izvor: IzvorPristanka,
): Promise<void> {
  const stavke = pristanciPriRegistraciji(jezik);
  // `skipDuplicates` nad `@@unique([userId, vrsta, verzija])` — dupli submit
  // obrasca i dovršavanje OAuth naloga koji je red već imao ne prave drugi zapis.
  await tx.zapisPristanka.createMany({
    data: stavke.map((s) => ({
      userId,
      vrsta: s.vrsta as VrstaPristanka,
      verzija: s.verzija,
      tekst: s.tekst,
      jezik: s.jezik,
      izvor,
    })),
    skipDuplicates: true,
  });

  await upisiPrihvatanjeTekuceVerzije(tx, userId);
}

/**
 * Upisuje i `PolitikaPrihvatanje` za tekuću `PolitikaVerzija`, u istoj transakciji.
 *
 * 🔴 Ovo nije duplikat `ZapisPristanka` nego most ka gejtu. `pristanakStatus()`
 * čita ISKLJUČIVO `PolitikaPrihvatanje`; bez ovog upisa bi paljenje prekidača
 * `PRISTANAK_NA_AKTE_TRAZI_SE` prikazalo ekran „Sistem je unapređen" i onome ko je
 * pristanak upravo dao pri registraciji — dakle svakom novom čoveku, iako je
 * kvačicu čekirao pre trideset sekundi. Prekidač je upaljen zbog ZATEČENIH naloga
 * i sme da pogodi samo njih.
 *
 * 🔴 Redosled je isti kao u `pristanakStatus()` (`efektivnaOd`, `createdAt`, `id`)
 * i mora takav da ostane: `orderBy` samo po `efektivnaOd` je neodređen kad dve
 * verzije dele isti trenutak, pa bi se upis i provera mogli razići — a razlaz
 * ovde znači isti bljesak ekrana koji je jednom već opisan u `politika.ts`.
 *
 * Nema verzije u bazi → nema šta da se prihvati; `pristanakStatus` tada ionako
 * vraća `potrebno: false`.
 */
async function upisiPrihvatanjeTekuceVerzije(tx: Tx, userId: string): Promise<void> {
  const najnovija = await tx.politikaVerzija.findFirst({
    where: { efektivnaOd: { lte: new Date() } },
    orderBy: [{ efektivnaOd: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  if (!najnovija) return;

  await tx.politikaPrihvatanje.createMany({
    data: [{ userId, verzijaId: najnovija.id, prihvacen: true }],
    skipDuplicates: true,
  });
}

/**
 * Beleži pristanak prijavljenog korisnika na analitičke kolačiće.
 *
 * 🔴 Samo za PRIJAVLJENOG korisnika, i to je granica mere M-5. Zapis pristanka
 * neprijavljenog posetioca tražio bi da se posetilac nekako identifikuje — dakle
 * nov podatak o njemu, radi dokazivanja pristanka na obradu. Kružno, i suprotno
 * čl. 3 Politike, gde minimizacija stoji kao strukturni princip. Za posetioca
 * odluku nosi kolačić, a dokaz je u tome što je mehanizam ispravan: ništa se ne
 * učitava pre odluke i odbijanje je jednako lako kao prihvatanje.
 *
 * Idempotentno po verziji: ponovljeno prihvatanje iste verzije ne gomila redove,
 * nego oživljava povučen zapis.
 */
export async function zabeleziPristanakKolacici(userId: string, jezik: string): Promise<void> {
  const s = tekstPristankaNaKolacice(jezik);
  await prisma.zapisPristanka.upsert({
    where: {
      userId_vrsta_verzija: { userId, vrsta: "KOLACICI_ANALITIKA", verzija: s.verzija },
    },
    // Ko je pristanak ranije povukao pa ga sada daje ponovo — isti red oživljava.
    update: { povucenAt: null, datAt: new Date(), tekst: s.tekst, jezik: s.jezik },
    create: {
      userId,
      vrsta: "KOLACICI_ANALITIKA",
      verzija: s.verzija,
      tekst: s.tekst,
      jezik: s.jezik,
      izvor: "kolacici",
    },
  });
}

/**
 * Opoziv pristanka (ZZPL čl. 15 st. 3 — mora biti jednako lak kao davanje).
 *
 * 🔴 Red se NE briše nego dobija `povucenAt`. Opoziv ne čini raniju obradu
 * nezakonitom (čl. 15 st. 3 to izričito kaže), pa dokaz da je pristanak postojao
 * mora da ostane — inače bi opoziv obrisao i osnov za ono što je već urađeno.
 */
export async function povuciPristanak(userId: string, vrsta: VrstaPristanka): Promise<void> {
  await prisma.zapisPristanka.updateMany({
    where: { userId, vrsta, povucenAt: null },
    data: { povucenAt: new Date() },
  });
}

export type PristanakZaPrikaz = {
  vrsta: VrstaPristanka;
  verzija: string;
  tekst: string;
  jezik: string;
  datAt: string;
  povucenAt: string | null;
};

/**
 * Svi pristanci korisnika, najnoviji prvi — za pregled na profilu i za izvoz
 * podataka po ZZPL čl. 26.
 *
 * Prikazuje se SNIMLJEN tekst, ne današnji: čovek treba da vidi ono što je tada
 * pročitao, a ne ono što bismo mu danas pokazali.
 */
export async function dohvatiPristanke(userId: string): Promise<PristanakZaPrikaz[]> {
  const redovi = await prisma.zapisPristanka.findMany({
    where: { userId },
    orderBy: { datAt: "desc" },
    select: { vrsta: true, verzija: true, tekst: true, jezik: true, datAt: true, povucenAt: true },
  });
  return redovi.map((r) => ({
    vrsta: r.vrsta,
    verzija: r.verzija,
    tekst: r.tekst,
    jezik: r.jezik,
    datAt: r.datAt.toISOString(),
    povucenAt: r.povucenAt?.toISOString() ?? null,
  }));
}
