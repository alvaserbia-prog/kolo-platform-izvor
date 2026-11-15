/**
 * Pokazatelji sistema: merenje, dnevni snimak i niz po danima. Formule i ciljevi su
 * u `src/lib/pokazatelji-pravila.ts`; ovde se samo čita baza.
 *
 * 🔴 Merenje samo nad živim (CLAUDE.md pravilo 19, `docs/merenje-stanja.md`):
 * punoletni, aktivni nalozi; dete ne ulazi ni u jedan broj. 🔴 Ništa odavde ne vraća
 * identifikator lica ni broj po licu, i nijedan upit ne grupiše prepise po paru
 * strana (praćenje obrazaca prepisa je odbijena mera). 🔴 Pokazatelji nemaju dejstvo:
 * ovaj modul ne poziva nijedan servis koji menja stanje; piše samo sopstveni snimak
 * (`PokazateljSistemaDan`). Brana: `__tests__/pokazatelji-sistema-izvor.test.ts`.
 */
import { prisma } from "@/lib/prisma";
import { USLOV_CLANA_U_SPISKU } from "@/lib/clanovi-spisak";
import { USLOVI_STATUSA } from "@/lib/admin-clanovi";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { glasackaMoc, smeAktiviratiZrno } from "@/lib/gornje-kolo-pravila";
import { IZBOR_STATUSA, statusUcesnika } from "./status";
import { beogradskiDan, danObracuna, prethodniDan } from "./obracunski-dan";
import {
  KATEGORIJE_HRANE,
  POCETAK_NIZA,
  procitajSirovo,
  type DanNiza,
  type SirovoStanje,
} from "@/lib/pokazatelji-pravila";

export * from "@/lib/pokazatelji-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";

const ZIV_PUNOLETAN = { ...USLOV_CLANA_U_SPISKU, maloletan: false } as const;
const PONUDA = { status: "ACTIVE" as const, tip: "PONUDA" as const };

/** Zbirni brojevi u ovom trenutku. Isto brojanje kao upit u `docs/merenje-stanja.md`. */
export async function izmeriStanje(): Promise<SirovoStanje> {
  const [korisnici, ucesnici, ponude, ponudeHrane, saPonudom, razmene, protokol, glasovi] = await Promise.all([
    prisma.user.count({ where: ZIV_PUNOLETAN }),
    // U Kolu: član bez potvrde, član Kola, čuvar Kola, osnivač (`USLOVI_STATUSA` nosi `maloletan: false`).
    prisma.user.count({ where: { AND: [USLOV_CLANA_U_SPISKU, USLOVI_STATUSA.verifikovan] } }),
    prisma.marketplaceListing.count({ where: { ...PONUDA, seller: ZIV_PUNOLETAN } }),
    prisma.marketplaceListing.count({
      where: { ...PONUDA, category: { in: [...KATEGORIJE_HRANE] }, seller: ZIV_PUNOLETAN },
    }),
    // Ko nudi: čita se samo da li je ponuđač član odobrenog gazdinstva — radi brojanja
    // gazdinstva jednom; identifikator lica se ne čita.
    prisma.user.findMany({
      where: { ...ZIV_PUNOLETAN, listings: { some: PONUDA } },
      select: {
        clanstvaGazdinstva: {
          where: { status: "ODOBREN", istupioAt: null, gazdinstvo: { status: "ODOBRENO", obrisanoAt: null } },
          select: { gazdinstvoId: true },
        },
      },
    }),
    // Razmene od početka: obe strane žive i punoletne. Samo broj i zbir.
    prisma.transaction.aggregate({
      where: { ...USLOV_RAZMENE, fromWallet: { user: ZIV_PUNOLETAN }, toWallet: { user: ZIV_PUNOLETAN } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.wallet.findUnique({ where: { id: PROTOKOL_WALLET_ID }, select: { balance: true } }),
    glasoviPerioda(),
  ]);

  const gazdinstva = new Set<string>();
  let pojedinci = 0;
  for (const u of saPonudom) {
    if (u.clanstvaGazdinstva.length === 0) pojedinci++;
    else gazdinstva.add(u.clanstvaGazdinstva[0].gazdinstvoId);
  }

  return {
    korisnici,
    ucesnici,
    korisniciSaPonudom: saPonudom.length,
    ponude,
    ponudeHrane,
    ponudjaciGazdinstva: gazdinstva.size,
    ponudjaciPojedinci: pojedinci,
    razmene: razmene._count._all,
    razmenjeniPoen: razmene._sum.amount ?? 0,
    opticaj: Math.abs(protokol?.balance ?? 0),
    ...glasovi,
  };
}

/**
 * Glasovi u sastavu Gornjeg Kola za tekući obračunski period, zbirno: osnivači i
 * ostali čuvari Kola. Glas je koren aktiviranog ZRNA (`glasackaMoc`), pre
 * delegiranja — glas pripada onome ko je ZRNO aktivirao. Pre Faze 2 oba zbira su 0.
 * Iskazuje se od prvog aktiviranog ZRNA (odluka vlasnika 15.11.2026).
 */
async function glasoviPerioda(): Promise<Pick<SirovoStanje, "faza2" | "glasoviOsnivaca" | "glasoviOstalih">> {
  const kanal = await prisma.zrnoKanal.findUnique({ where: { id: "singleton" }, select: { isActive: true } });
  if (!kanal?.isActive) return { faza2: false, glasoviOsnivaca: 0, glasoviOstalih: 0 };

  const stanja = await prisma.zrnoStanje.findMany({
    where: { aktivno: { gt: 0 }, user: ZIV_PUNOLETAN },
    select: { aktivno: true, user: { select: IZBOR_STATUSA } },
  });
  let glasoviOsnivaca = 0;
  let glasoviOstalih = 0;
  for (const s of stanja) {
    if (!smeAktiviratiZrno(statusUcesnika(s.user))) continue;
    if (s.user.jeOsnivac) glasoviOsnivaca += glasackaMoc(s.aktivno);
    else glasoviOstalih += glasackaMoc(s.aktivno);
  }
  return { faza2: true, glasoviOsnivaca, glasoviOstalih };
}

const danKaoTekst = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Dnevni snimak (`PokazateljSistemaDan`): samo zbirni brojevi, bez ijednog
 * identifikatora lica. Snimak nosi dan koji se upravo završio. Isti dan se ne
 * upisuje dvaput; ako je dan ranije naknadno izračunat, noćni snimak ga zamenjuje.
 */
export async function zapisiDnevniSnimak(datum: Date): Promise<string> {
  const vrednosti = await izmeriStanje();
  const dan = prethodniDan(danObracuna(datum));
  await prisma.pokazateljSistemaDan.upsert({
    where: { date: dan },
    create: { date: dan, vrednosti, naknadno: false },
    update: {},
  });
  // Naknadno izračunat red za isti dan ustupa mesto izmerenom.
  await prisma.pokazateljSistemaDan.updateMany({ where: { date: dan, naknadno: true }, data: { vrednosti, naknadno: false } });
  return danKaoTekst(dan);
}

/** Ceo niz po danima, rastući, od `POCETAK_NIZA`. */
export async function nizPoDanima(): Promise<DanNiza[]> {
  const redovi = await prisma.pokazateljSistemaDan.findMany({
    where: { date: { gte: new Date(`${POCETAK_NIZA}T00:00:00Z`) } },
    orderBy: { date: "asc" },
    select: { date: true, vrednosti: true, naknadno: true },
  });
  const niz: DanNiza[] = [];
  for (const r of redovi) {
    const sirovo = procitajSirovo(r.vrednosti);
    if (sirovo) niz.push({ dan: danKaoTekst(r.date), naknadno: r.naknadno, sirovo });
  }
  return niz;
}

/** Današnje stanje (mereno sada) sa oznakom dana po srpskom vremenu. */
export async function danasnjeStanje(sada: Date = new Date()): Promise<{ dan: string; sirovo: SirovoStanje }> {
  return { dan: danKaoTekst(beogradskiDan(sada)), sirovo: await izmeriStanje() };
}
