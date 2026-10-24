/**
 * Jezgro statusa učesnika (set 4.8.2) — servisni ulaz.
 *
 * Kolone `verified`, `verifiedAt`, `indeksStvarnosti`, `potvrdjenAt` i
 * `tipKorisnika` su KEŠ izveden iz grafa: živi redovi `VerifikacionaVeza` i živi
 * redovi `PotvrdaClana`, uz `jeOsnivac`, `maloletan` i stanje ZRNA.
 *
 * 🔴 Upisuje ih ISKLJUČIVO `preracunajStatusNaloga()` (izuzeci: migracija, seed,
 * skripta prelaza i `reset-korisnika.ts`). Brana: `__tests__/status-ucesnika-izvor.test.ts`.
 *
 * Obrazac (CLAUDE.md pravilo 8): pozivalac menja graf i zove
 * `preracunajStatusNaloga(tx, userId)` u ISTOJ transakciji, a posledice
 * (`posledicePromeneStatusa`) izvršava VAN nje — one ne bacaju.
 *
 * Čista pravila su u `@/lib/status-ucesnika-pravila` i ovde se re-eksportuju
 * (pravilo 9), pa server ima jedan ulaz.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { izracunajIndeks, zasticeniIndeks } from "./dokaz-stvarnosti";
import {
  statusUcesnika,
  prestaoStatus,
  jeCuvar,
  jeDete,
  jePotvrdjen,
  jeVerifikovan,
  porukaStatusa,
  type StatusUcesnika,
} from "@/lib/status-ucesnika-pravila";

export * from "@/lib/status-ucesnika-pravila";

type Tx = Prisma.TransactionClient;
type Klijent = Tx | typeof prisma;

/**
 * Prisma `select` dovoljan za `statusUcesnika` (bez stanja deteta). Nosi i
 * `status`/`deaktiviranAt`, jer isključen ili ugašen nalog nema status ni kad je
 * osnivač (`prestaoStatus`).
 */
export const IZBOR_STATUSA = {
  maloletan: true,
  jeOsnivac: true,
  verified: true,
  indeksStvarnosti: true,
  potvrdjenAt: true,
  tipKorisnika: true,
  status: true,
  deaktiviranAt: true,
} as const;

type ZapisStatusa = {
  maloletan: boolean;
  jeOsnivac: boolean;
  verified: boolean;
  indeksStvarnosti: number;
  potvrdjenAt: Date | null;
  tipKorisnika: string;
  status?: string | null;
  deaktiviranAt?: Date | null;
};

async function stanjeDetetaZa(userId: string) {
  // Dinamički uvoz: `deca.ts` je veliki modul koji će i sam čitati status, pa se
  // kružni uvoz izbegava na ovom mestu.
  const { stanjeNaloga } = await import("./deca");
  return stanjeNaloga(userId);
}

async function statusIzZapisa(userId: string, z: ZapisStatusa): Promise<StatusUcesnika> {
  if (z.maloletan) {
    return statusUcesnika({ ...z, stanjeDeteta: await stanjeDetetaZa(userId) });
  }
  return statusUcesnika(z);
}

/**
 * Status učesnika iz baze. Za maloletni nalog stanje se čita iz `deca.ts`
 * (`stanjeNaloga`). `null` kad nalog ne postoji.
 */
export async function ucitajStatus(userId: string, db: Klijent = prisma): Promise<StatusUcesnika | null> {
  const z = await db.user.findUnique({ where: { id: userId }, select: IZBOR_STATUSA });
  if (!z) return null;
  return statusIzZapisa(userId, z);
}

export type PromenaStatusa = {
  pre: StatusUcesnika;
  posle: StatusUcesnika;
};

/**
 * Preračunava keš statusa iz grafa i upisuje ga ako se razlikuje (§1.2):
 *
 *  - `verified`: postoji bar jedna živa veza u kojoj je nalog verifikovani
 *    (osnivač uvek);
 *  - `indeksStvarnosti`: `izracunajIndeks(broj veza)`; osnivač 100 (interni
 *    zapis, ne prikazuje se);
 *  - `potvrdjenAt`: postoji veza vrste POTVRDA ili uvođenje sa živom
 *    `PotvrdaClana`; osnivač uvek. Zadržava se zatečena vrednost, prva potvrda
 *    dobija `now()`, pad je briše;
 *  - `tipKorisnika`: NEVERIFIKOVAN ako nije verifikovan (i svako dete);
 *    NOSILAC_ZRNA ako je potvrđen i drži ZRNO (`slobodno + aktivno > 0`) ili je
 *    osnivač; inače REGULARNI. Član bez potvrde sa ZRNOM je zato REGULARNI.
 *
 * 🔴 Nalog kome je status PRESTAO (`prestaoStatus`: `EXCLUDED` ili `deaktiviranAt`;
 * Pravilnik čl. 33, 34) nema status učesnika: upisuje mu se `verified = false`,
 * `verifiedAt = null`, indeks 0, `potvrdjenAt = null`, NEVERIFIKOVAN — bez obzira
 * na zatečene veze, i osnivaču. Veze se pri tom NE brišu (veze koje je dao ostaju po
 * dokaz stvarnosti čl. 16). Suspenzija nije prestanak i ne dira se. Izlazi iz
 * sistema ovo ne zovu neposredno, nego kroz `ugasiOznakeNaloga` (`izlaz-naloga.ts`).
 *
 * Mora se zvati u transakciji koja je promenila graf. Ne izvršava posledice —
 * vrati `{ pre, posle }`, a pozivalac posle transakcije zove
 * `posledicePromeneStatusa(userId, pre, posle)`.
 */
export async function preracunajStatusNaloga(tx: Tx, userId: string): Promise<PromenaStatusa> {
  const u = await tx.user.findUnique({
    where: { id: userId },
    select: {
      ...IZBOR_STATUSA,
      verifiedAt: true,
      zrnoStanje: { select: { slobodno: true, aktivno: true } },
    },
  });
  if (!u) throw new Error(`preracunajStatusNaloga: nalog ${userId} ne postoji`);

  const veze = await tx.verifikacionaVeza.findMany({
    where: { verifikovaniId: userId },
    select: {
      vrsta: true,
      vremenskiZig: true,
      potvrdeClana: { where: { aktivnaKljuc: { not: null } }, select: { id: true }, take: 1 },
    },
    orderBy: { vremenskiZig: "asc" },
  });

  const dete = u.maloletan;
  const prestao = prestaoStatus(u);
  const osnivac = u.jeOsnivac && !dete && !prestao;
  const verified = !dete && !prestao && (osnivac || veze.length > 0);
  const indeks = dete || prestao ? 0 : zasticeniIndeks(osnivac, izracunajIndeks(veze.length));
  const potvrdjen =
    verified &&
    (osnivac || veze.some((v) => v.vrsta === "POTVRDA" || (v.vrsta === "UVODJENJE" && v.potvrdeClana.length > 0)));
  const imaZrno = (u.zrnoStanje?.slobodno ?? 0) + (u.zrnoStanje?.aktivno ?? 0) > 0;
  const tip = !verified ? "NEVERIFIKOVAN" : osnivac || (potvrdjen && imaZrno) ? "NOSILAC_ZRNA" : "REGULARNI";

  const sada = new Date();
  const novo = {
    verified,
    verifiedAt: verified ? (u.verifiedAt ?? veze[0]?.vremenskiZig ?? sada) : null,
    indeksStvarnosti: indeks,
    potvrdjenAt: potvrdjen ? (u.potvrdjenAt ?? sada) : null,
    tipKorisnika: tip,
  } as const;

  const promenjeno =
    u.verified !== novo.verified ||
    (u.verifiedAt?.getTime() ?? null) !== (novo.verifiedAt?.getTime() ?? null) ||
    u.indeksStvarnosti !== novo.indeksStvarnosti ||
    (u.potvrdjenAt?.getTime() ?? null) !== (novo.potvrdjenAt?.getTime() ?? null) ||
    u.tipKorisnika !== novo.tipKorisnika;

  if (promenjeno) {
    await tx.user.update({ where: { id: userId }, data: novo });
  }

  if (dete) {
    // Keš ne određuje status deteta — pre i posle su isto stanje iz `deca.ts`.
    const s = await statusIzZapisa(userId, u);
    return { pre: s, posle: s };
  }
  // „pre" je status koji je keš do sada nosio — i kad je nalog u ISTOJ transakciji
  // upravo isključen ili ugašen, da bi posledice (ZRNO, deca, gazdinstva) videle
  // promenu. Osnivaču čiji je keš već ugašen „pre" je takođe bez statusa.
  const pre = !prestao
    ? statusUcesnika(u)
    : u.jeOsnivac && !u.verified
      ? "KORISNIK"
      : statusUcesnika({ ...u, status: null, deaktiviranAt: null });
  return {
    pre,
    posle: statusUcesnika({ ...u, ...novo }),
  };
}

/** Ključ obaveštenja o novom statusu (`notifikacije.status_novi_<status>`). */
const OBAVESTENJE: Partial<Record<StatusUcesnika, { naslov: string; tekst: string }>> = {
  KORISNIK: {
    naslov: "Tvoj status je sada: korisnik",
    tekst:
      "Tvoj nalog više nije ni uveden u Kolo ni potvrđen, pa si sada korisnik. Oglasi, prepis POEN-a i donacije ostaju ti dostupni; upisano ZRNO je zamrznuto. Član Kola koji te lično zna može da te potvrdi — pokaži mu svoj kod.",
  },
  CLAN_BEZ_POTVRDE: {
    naslov: "Tvoj status je sada: član bez potvrde",
    tekst:
      "Kao član bez potvrde ne možeš da potvrđuješ druge ni da glasaš. Ne vidiš ko želi da ga neko nazove, ne potvrđuješ postojanje deteta, ne daješ preporuku i ne aktiviraš ZRNO. Ništa se ne plaća. Onaj ko te uvede u Kolo ne dobija ništa dok ti sam ne doprineseš. Pripadnost Kolu nije članstvo u Fondaciji. Član Kola koji te lično zna može da te potvrdi — pokaži mu svoj kod.",
  },
  CLAN_KOLA: {
    naslov: "Tvoj status je sada: član Kola",
    tekst:
      "Tvoj status na platformi je sada član Kola. Možeš da potvrđuješ ljude koje lično znaš. Pripadnost Kolu nije članstvo u Fondaciji.",
  },
  CUVAR_KOLA: {
    naslov: "Tvoj status je sada: čuvar Kola",
    tekst:
      "Tvoj status na platformi je sada čuvar Kola. Aktivirano ZRNO ti daje glas u Gornjem Kolu. Pripadnost Kolu nije članstvo u Fondaciji.",
  },
};

export type OpcijePosledica = {
  /**
   * Obaveštenje samom učesniku o novom statusu. Isključiti (`false`) kad pozivalac
   * isti događaj već javlja sopstvenim obaveštenjem (npr. ruta verifikacije).
   */
  obavestiUcesnika?: boolean;
};

/**
 * Posledice promene statusa — VAN transakcije, ne baca (svaki korak zasebno):
 *
 *  - aktivno ZRNO učesnika koji više nije čuvar ide u `OTKLJUCAJ` zahtev za danas,
 *    pa prelazi u slobodno na kraju perioda (Pravilnik čl. 20 st. 4, 30 st. 3;
 *    dokaz čl. 17 st. 3);
 *  - deca roditelja: `posleStatusaRoditelja` (deca čl. 6 st. 8, 20);
 *  - gazdinstva: `osveziPravaGazdinstvaPoStatusu` i `probajEvidentiratiGazdinstvo`;
 *  - obaveštenje samom učesniku (za člana bez potvrde sa obaveznim rečenicama, §4.3).
 */
export async function posledicePromeneStatusa(
  userId: string,
  pre: StatusUcesnika,
  posle: StatusUcesnika,
  opcije: OpcijePosledica = {},
): Promise<void> {
  if (pre === posle || jeDete(posle)) return;

  // 1. ZRNO: ko nije čuvar, ne drži aktivno ZRNO.
  if (!jeCuvar(posle)) {
    try {
      const { beogradskiDan } = await import("./obracunski-dan");
      const stanje = await prisma.zrnoStanje.findUnique({ where: { userId }, select: { aktivno: true } });
      const aktivno = stanje?.aktivno ?? 0;
      if (aktivno > 0) {
        const vecTrazeno = await prisma.zrnoStatusZahtev.aggregate({
          where: { userId, akcija: "OTKLJUCAJ", status: "PENDING" },
          _sum: { kolicina: true },
        });
        const kolicina = aktivno - (vecTrazeno._sum.kolicina ?? 0);
        if (kolicina > 0) {
          await prisma.zrnoStatusZahtev.create({
            data: { userId, kolicina, akcija: "OTKLJUCAJ", date: beogradskiDan() },
          });
        }
      }
    } catch (e) {
      console.error("[status] OTKLJUCAJ posle pada statusa nije upisan", userId, e);
    }
  }

  // 2. Deca roditelja.
  try {
    const { posleStatusaRoditelja } = await import("./deca-status");
    await posleStatusaRoditelja(userId, pre, posle);
  } catch (e) {
    console.error("[status] posledice po decu nisu izvršene", userId, e);
  }

  // 3. Gazdinstva.
  try {
    const { osveziPravaGazdinstvaPoStatusu } = await import("./gazdinstvo-status");
    await osveziPravaGazdinstvaPoStatusu(userId);
    if (jeVerifikovan(posle) && !jeVerifikovan(pre)) {
      const { probajEvidentiratiGazdinstvo } = await import("./gazdinstvo");
      await probajEvidentiratiGazdinstvo(userId);
    }
  } catch (e) {
    console.error("[status] posledice po gazdinstvo nisu izvršene", userId, e);
  }

  // 4. Obaveštenje učesniku.
  if (opcije.obavestiUcesnika !== false) {
    const o = OBAVESTENJE[posle];
    if (o) {
      try {
        const { obavesti } = await import("@/lib/notifikacije");
        await obavesti(userId, {
          tip: "STATUS",
          kljuc: `notifikacije.status_novi_${porukaStatusa(posle)}`,
          naslov: o.naslov,
          tekst: o.tekst,
          link: "/verifikacija",
          email: false,
        });
      } catch (e) {
        console.error("[status] obaveštenje o statusu nije poslato", userId, e);
      }
    }
  }
}

/** Da li se potvrđenost promenila (za pozivaoce koji granaju posledice). */
export function promenjenaPotvrdjenost(p: PromenaStatusa): boolean {
  return jePotvrdjen(p.pre) !== jePotvrdjen(p.posle);
}
