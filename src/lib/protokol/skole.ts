/**
 * Ranglista škola — servisne funkcije (rade sa bazom).
 *
 * Čista pravila su u `src/lib/skola.ts`, podaci u `src/lib/skole-srbije.ts`. Ovaj
 * modul ih re-eksportuje, pa server ima jedan ulaz.
 *
 * Osnov: Pravilnik o učešću dece — čl. 26 (škola kao podatak koji navodi sámo dete
 * i pregled po školama). Plan: `docs/plan-ranglista-skola.html`.
 *
 * ─── Šta ovaj modul NE radi ─────────────────────────────────────────────────
 *
 * 🔴 Ne dodiruje POEN. Ni izbor škole ni mesto na listi ne nose nijedan zapis.
 * Da nose, bio bi to jedanaesti kanal iz čl. 19 Pravilnika o KOLO sistemu, sa dnevnim
 * limitom i celim aparatom — a emisija vezana za broj naloga gura opticaj ka
 * osnivačkom koraku. Ranglista postojećoj motivaciji (500 POEN po prijateljstvu,
 * deca čl. 33) daje samo PRAVAC.
 */

import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { FUNKCIONALNI_PRAG_INDEKSA } from "./dokaz-stvarnosti";
import {
  razresiSkolu,
  pozicijaPoBroju,
  rangirajPoBroju,
  rangirajPoProcentu,
  samoSaDecom,
  smePromenitiSkolu,
  skolePostoje,
  PORUKA_SKOLA_SA_SPISKA,
  type RedSkole,
  type KarticaSkole,
  type Skola,
  type TipSkole,
} from "@/lib/skola";
import { SKOLE } from "@/lib/skole-srbije";

export {
  razresiSkolu,
  rangirajPoBroju,
  rangirajPoProcentu,
  samoSaDecom,
  smePromenitiSkolu,
  skolePostoje,
  ROK_PROMENE_SKOLE_DANA,
  PORUKA_SKOLA_SA_SPISKA,
  pozicijaPoBroju,
  udeoUkljucenosti,
  pretraziSkole,
} from "@/lib/skola";
export type { Skola, TipSkole, RedSkole, RedSkoleSaProcentom, Pozicija, KarticaSkole } from "@/lib/skola";

/**
 * Uslov „dete Kola" — jedini izvor istine za sve što ranglista broji i za vidljivost
 * oglasa deteta (`USLOV_PRODAVAC_RADI` u `deca.ts`).
 *
 * 🔴 Ovo je Prisma prevod stanja `AKTIVNO` iz `stanjeDeteta()` (`deca-pravila.ts`,
 * set 4.8.2): maloletan nalog koji radi i ima BAR JEDNU vezu sa roditeljem u kojoj
 * su istovremeno ispunjena sva tri uslova (Pravilnik o učešću dece čl. 5 st. 1 t. 3, čl. 13, 17):
 *  - veza nije zaustavljena po prijavi lažnog roditeljstva (`zaustavljenaAt: null`);
 *  - roditelj je aktivan i član Kola ili osnivač (`potvrdjenIzPolja`: osnivač, ili
 *    verifikovan sa indeksom ≥ praga i `potvrdjenAt`);
 *  - ZA TU VEZU postoji živa potvrda postojanja deteta.
 *
 * Zašto upit, a ne učitavanje svakog deteta: stanje se ne čuva u koloni nego se
 * izvodi iz roditelja, pa bi rangiranje inače značilo jedan upit po detetu.
 *
 * 🔴 Ako se `stanjeDeteta()` ikad promeni, OVAJ uslov mora s njim — inače u sistemu
 * postoje dve istine o tome šta je dete Kola. Test `skole.test.ts` i
 * `deca-stanja-izvor.test.ts` drže oba opisa.
 */
export const USLOV_AKTIVNO_DETE = {
  maloletan: true,
  status: UserStatus.ACTIVE,
  deaktiviranAt: null,
  roditeljstvaKaoDete: {
    some: {
      zaustavljenaAt: null,
      roditelj: {
        // `aktivan`: nalog radi — nije ugašen ni isključen.
        status: UserStatus.ACTIVE,
        deaktiviranAt: null,
        maloletan: false,
        // `potvrdjen`: član Kola ili osnivač (član bez potvrde NE — čl. 5 st. 2).
        OR: [
          { jeOsnivac: true },
          { verified: true, indeksStvarnosti: { gte: FUNKCIONALNI_PRAG_INDEKSA }, potvrdjenAt: { not: null } },
        ],
      },
      // `postojanjePotvrdjeno`: živa potvrda postojanja deteta za OVU vezu (čl. 13).
      potvrdePostojanja: { some: { potvrdjenoAt: { not: null }, ponistenaAt: null } },
    },
  },
} satisfies Prisma.UserWhereInput;

/**
 * Broj aktivne dece po školi, za sve škole koje imaju bar jedno.
 *
 * Rang je ŽIVA vrednost, ne snimak: kad roditelju padne potvrda, dete istog trena
 * izlazi iz brojanja. Zato nema noćnog posla ni zabeleženog stanja koje bi se
 * razišlo sa stvarnim — isti obrazac kao brojač putanje doprinosa razmeni.
 */
async function brojDecePoSkoli(): Promise<Map<string, number>> {
  const grupe = await prisma.user.groupBy({
    by: ["skolaSifra"],
    where: { ...USLOV_AKTIVNO_DETE, skolaSifra: { not: null } },
    _count: { _all: true },
  });
  return new Map(
    grupe.filter((g) => g.skolaSifra !== null).map((g) => [g.skolaSifra as string, g._count._all])
  );
}

/**
 * Redovi ranglista za jedan tip škole — SAMO škole sa bar jednim uključenim detetom.
 *
 * 🔴 Odluka vlasnika (2026-08-23) i obrt ranijeg pravila: do ove izmene je lista
 * nosila ceo šifarnik, pa je iza prvih nekoliko redova išlo hiljadu i po nula.
 * Obrazloženje i šta se time gubi — vidi `samoSaDecom` u `skola.ts`.
 *
 * Filter je JEDAN, ovde, jer odavde čitaju sve tri strane (obe nacionalne liste,
 * stranica jedne škole i kartica na dečjoj početnoj) — inače bi „ukupno škola" na
 * jednom ekranu značilo nešto drugo nego na drugom.
 *
 * Prikaz uz brojku i dalje nosi objašnjenje da se broje samo deca čiji je roditelj
 * član Kola i kojima je postojanje potvrđeno (deca Kola), inače mali broj izgleda kao kvar.
 */
export async function redoviSkola(tip: TipSkole): Promise<RedSkole[]> {
  const brojevi = await brojDecePoSkoli();
  return samoSaDecom(
    SKOLE.filter((s) => s.tip === tip).map((s) => ({
      ...s,
      dece: brojevi.get(s.sifra) ?? 0,
    }))
  );
}

/** Obe nacionalne liste za jedan tip škole, već poređane. */
export async function ranglisteSkola(tip: TipSkole) {
  const redovi = await redoviSkola(tip);
  return {
    poBroju: rangirajPoBroju(redovi),
    poProcentu: rangirajPoProcentu(redovi),
  };
}

/** Jedno dete na listi unutar škole. */
export type DeteUSkoli = {
  id: string;
  pseudonim: string;
  avatar: string | null;
  poen: number;
};

/**
 * Deca jedne škole, poređana po tekućem stanju POEN-a (odluka vlasnika).
 *
 * 🔴 Rangira se STANJE, ne stečeno. Posledica koju treba znati: u rang ulazi i POEN
 * koji je detetu prepisao roditelj ili druga deca, a potrošeni POEN iz njega izlazi.
 * Odluka je doneta svesno — kad deca dobiju sopstvene zadatke, stanje će sve više
 * odražavati njihov rad, pa se razlika sama smanjuje.
 *
 * Vraća samo ono što stoji na listi: nadimak, sličicu i broj. Ni sa jednog reda se
 * NE ulazi u profil (vidi `zatvorenProfil` u `deca.ts`) — lista pokazuje da dete
 * postoji, ona nije vrata ni u šta.
 */
export async function decaSkole(sifra: string): Promise<DeteUSkoli[]> {
  const deca = await prisma.user.findMany({
    where: { ...USLOV_AKTIVNO_DETE, skolaSifra: sifra },
    select: {
      id: true,
      pseudonim: true,
      avatar: true,
      wallet: { select: { balance: true } },
    },
  });

  return deca
    .map((d) => ({
      id: d.id,
      pseudonim: d.pseudonim,
      avatar: d.avatar,
      // Stanje može biti i negativno (nadoknada, otpis prijateljstva) — na listi se
      // prikazuje kako jeste, jer bi svođenje na nulu sakrilo da nešto duguje.
      poen: d.wallet?.balance ?? 0,
    }))
    .sort((a, b) => b.poen - a.poen || a.pseudonim.localeCompare(b.pseudonim, "sr"));
}

/** Greška ovog modula — nosi HTTP status, kao i ostali servisi Modula Deca. */
export class SkolaGreska extends Error {
  constructor(message: string, public status: 400 | 403 | 404 = 400) {
    super(message);
    this.name = "SkolaGreska";
  }
}

/**
 * Postavlja ili menja školu maloletnog naloga.
 *
 * Školu bira SÁMO dete (odluka vlasnika) — ruta zato prima nalog iz sesije i ne
 * dopušta postavljanje tuđe škole ni roditelju.
 *
 * `sifra === null` briše izbor. Brisanje NE pokreće rok od 30 dana: ono ne pomera
 * nijednu listu naviše, a inače bi dete koje se predomislilo ostalo mesec dana bez
 * škole umesto da izabere pravu.
 */
export async function postaviSkolu(userId: string, sifra: string | null): Promise<Skola | null> {
  const nalog = await prisma.user.findUnique({
    where: { id: userId },
    select: { maloletan: true, skolaSifra: true, skolaPromenjenaAt: true },
  });
  if (!nalog) throw new SkolaGreska("Nalog nije pronađen.", 404);
  if (!nalog.maloletan) {
    throw new SkolaGreska("Školu navodi dete na svom nalogu.", 403);
  }
  // Dete na čekanju školu ne navodi (čl. 5 st. 1 t. 1, 26 st. 1) — do preuzimanja se
  // obrađuje samo ono što služi kontaktu sa roditeljem (čl. 9).
  const { stanjeNaloga } = await import("./deca");
  if ((await stanjeNaloga(userId)) === "NA_CEKANJU") {
    throw new SkolaGreska("Školu biraš kad mama ili tata preuzmu tvoj nalog.", 403);
  }

  if (sifra === null) {
    await prisma.user.update({ where: { id: userId }, data: { skolaSifra: null } });
    return null;
  }

  const skola = razresiSkolu(sifra);
  if (!skola) throw new SkolaGreska(PORUKA_SKOLA_SA_SPISKA, 400);

  // Ista škola koja već stoji nije promena — inače bi ponovljeni klik na isti red
  // potrošio rok od 30 dana.
  if (nalog.skolaSifra === skola.sifra) return skola;

  // Rok teče tek od PRVE izmene: prva postavka (`skolaSifra === null`) je prazna
  // ćelija koju dete popunjava, ne promena.
  const jePromena = nalog.skolaSifra !== null;
  if (jePromena) {
    const provera = smePromenitiSkolu(nalog.skolaPromenjenaAt, new Date());
    if (!provera.ok) throw new SkolaGreska(provera.razlog, provera.status);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      skolaSifra: skola.sifra,
      ...(jePromena ? { skolaPromenjenaAt: new Date() } : {}),
    },
  });
  return skola;
}

/**
 * Kartica koja nosi ceo mehanizam.
 *
 * Detetu se na početnoj ne prikazuje tabela nego JEDNA rečenica — mesto škole i
 * koliko fali do sledećeg. To je jedino što dete prepričava kod kuće, i po tome
 * ovaj mehanizam uspeva ili pada.
 */
export async function karticaSkoleZaDete(deteId: string): Promise<KarticaSkole | null> {
  const nalog = await prisma.user.findUnique({
    where: { id: deteId },
    select: { skolaSifra: true },
  });
  const skola = razresiSkolu(nalog?.skolaSifra ?? null);
  if (!skola) return null;

  const poredak = rangirajPoBroju(await redoviSkola(skola.tip));
  const poz = pozicijaPoBroju(poredak, skola.sifra);
  const deca = await decaSkole(skola.sifra);
  const mojeMesto = deca.findIndex((d) => d.id === deteId);

  return {
    sifra: skola.sifra,
    naziv: skola.naziv,
    mesto: skola.mesto,
    brojDece: deca.length,
    // 🔴 `null`, ne nula: na listu ulaze samo škole sa bar jednim uključenim
    // detetom, pa dete koje još čeka roditelja gleda svoju školu van poretka.
    // Nula bi se na ekranu pročitala kao „nulto mesto".
    mestoSkole: poz?.mesto ?? null,
    ukupnoSkola: poz?.ukupnoSkola ?? poredak.length,
    doSledecegMesta: poz?.doSledecegMesta ?? null,
    // Dete koje još čeka roditelja se ne broji, pa ga nema ni na spisku svoje
    // škole — kartica tada prikazuje školu bez sopstvenog mesta.
    mojeMesto: mojeMesto >= 0 ? mojeMesto + 1 : null,
  };
}
