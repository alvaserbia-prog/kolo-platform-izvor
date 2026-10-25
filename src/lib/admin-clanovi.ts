import { prisma } from "@/lib/prisma";
import { Prisma, TipKorisnika, UserStatus } from "@/generated/prisma/client";
import { TIP_PO_USLOVU } from "@/lib/protokol/potvrda-poen";
import { USLOV_AKTIVNO_DETE } from "@/lib/protokol/skole";
import { PRAG_VERIFIKACIJE } from "@/lib/status-ucesnika-pravila";

/**
 * Brojevi članova za prve dve kartice admin panela.
 *
 * 🔴 „Registrovani" je ISTI uslov kao broj članova na `/pocetna` (`deaktiviranAt: null`)
 * — obrisan nalog ostaje red u bazi (pseudonimizacija, ne brisanje; na njemu visi
 * istorija zapisa), pa bi `user.count()` bez uslova pokazao jednog više nego početna.
 *
 * Prvi red: ukupno = registrovani + brisani (NALOZI, ne učesnici — tu je i dete);
 * suspendovani su podskup registrovanih (nalog postoji, privremeno je zaključan).
 * Drugi red razlaže registrovane: redovni (verifikovani) + novi (korisnici) + deca =
 * registrovani. 🔴 Dete je korisnik, ali se nikad ne broji uz punoletne (set 4.8.2): svaki
 * brojač punoletnih nosi `maloletan: false`, a deca idu u svoju kolonu.
 *
 * „Aktivni" su podskup redovnih (početni članovi uključeni): verifikovan učesnik koji
 * ima i PRVI POTVRĐEN DOPRINOS — isti trag učešća koji otključava POEN po potvrdi
 * (dokaz stvarnosti čl. 7), pa se tipovi emisija čitaju iz `TIP_PO_USLOVU`, ne
 * prepisuju. Naziv je samo naziv kartice u panelu, ne status člana.
 *
 * `punoletni` je prvi red bez dece (admin Pregled): deca se tamo prikazuju u
 * sopstvenom odeljku, a ne pomešana sa pokazateljima sistema.
 *
 * Razlaganje po statusu iz akata (korisnik, član bez potvrde, član Kola, čuvar Kola,
 * osnivač, deca po stanju) daje `brojeviStatusa()`.
 */
export async function brojeviClanova() {
  const registrovan = { deaktiviranAt: null };
  const redovan = { ...registrovan, ...USLOVI_STATUSA.verifikovan };
  const [ukupno, registrovani, brisani, suspendovani, redovni, novi, deca, aktivni, punoletni] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: registrovan }),
    prisma.user.count({ where: { deaktiviranAt: { not: null } } }),
    prisma.user.count({ where: { ...registrovan, status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: redovan }),
    prisma.user.count({ where: { ...registrovan, ...USLOVI_STATUSA.korisnik } }),
    prisma.user.count({ where: { ...registrovan, maloletan: true } }),
    prisma.user.count({
      where: {
        ...redovan,
        wallet: { is: { incomingTx: { some: { type: { in: Object.values(TIP_PO_USLOVU) } } } } },
      },
    }),
    // Isti prvi red bez dece — admin Pregled pokazuje stanje sistema samo nad
    // punoletnim nalozima, a deca imaju svoj odeljak.
    Promise.all([
      prisma.user.count({ where: PUNOLETAN }),
      prisma.user.count({ where: { ...registrovan, ...PUNOLETAN } }),
      prisma.user.count({ where: { deaktiviranAt: { not: null }, ...PUNOLETAN } }),
      prisma.user.count({ where: { ...registrovan, ...PUNOLETAN, status: UserStatus.SUSPENDED } }),
    ]).then(([ukupno, registrovani, brisani, suspendovani]) => ({ ukupno, registrovani, brisani, suspendovani })),
  ]);
  return { ukupno, registrovani, brisani, suspendovani, redovni, novi, deca, aktivni, punoletni };
}

export type BrojeviClanova = Awaited<ReturnType<typeof brojeviClanova>>;

// ─── Status učesnika kao Prisma uslov (set 4.8.2) ────────────────────────────
//
// 🔴 Prisma prevod `statusUcesnika()` iz `status-ucesnika-pravila.ts` — isti redosled
// provera: dete PRVO (dete nema status iz podele i nije osnivač), pa osnivač, pa
// verifikovanost (`verified && indeks ≥ PRAG_VERIFIKACIJE`), pa potvrđenost
// (`potvrdjenAt`), pa čuvar (`NOSILAC_ZRNA`). Ako se pravilo promeni, ovaj prevod
// mora s njim. Brana: `__tests__/deca-u-brojacima-izvor.test.ts`.

const PUNOLETAN = { maloletan: false } as const;
const NIJE_OSNIVAC = { ...PUNOLETAN, jeOsnivac: false } as const;
const VERIFIKOVAN_NE_OSNIVAC = {
  ...NIJE_OSNIVAC,
  verified: true,
  indeksStvarnosti: { gte: PRAG_VERIFIKACIJE },
} as const;

// Osnivač čiji status nije prestao (`prestaoStatus`: isključen ili ugašen nalog nema
// status ni kad je osnivač). Ostalima to drži keš, koji `preracunajStatusNaloga` gasi.
const OSNIVAC_ZIV = {
  jeOsnivac: true,
  status: { not: UserStatus.EXCLUDED },
  deaktiviranAt: null,
} satisfies Prisma.UserWhereInput;
const OSNIVAC_PRESTAO: Prisma.UserWhereInput = {
  jeOsnivac: true,
  OR: [{ status: UserStatus.EXCLUDED }, { deaktiviranAt: { not: null } }],
};

export const USLOVI_STATUSA = {
  /** Korisnik: punoletan, nije verifikovan (Pravilnik čl. 28); i osnivač kome je status prestao. */
  korisnik: {
    ...PUNOLETAN,
    OR: [
      { jeOsnivac: false, OR: [{ verified: false }, { indeksStvarnosti: { lt: PRAG_VERIFIKACIJE } }] },
      OSNIVAC_PRESTAO,
    ],
  },
  /** Verifikovan: član bez potvrde, član Kola, čuvar Kola, osnivač. */
  verifikovan: {
    ...PUNOLETAN,
    OR: [OSNIVAC_ZIV, { verified: true, indeksStvarnosti: { gte: PRAG_VERIFIKACIJE } }],
  },
  /** Član bez potvrde (Pravilnik čl. 28a). */
  bezPotvrde: { ...VERIFIKOVAN_NE_OSNIVAC, potvrdjenAt: null },
  /** Član Kola (Pravilnik čl. 29) — potvrđen, bez ZRNA. */
  clanKola: {
    ...VERIFIKOVAN_NE_OSNIVAC,
    potvrdjenAt: { not: null },
    tipKorisnika: { not: TipKorisnika.NOSILAC_ZRNA },
  },
  /** Čuvar Kola (Pravilnik čl. 30) — potvrđen i drži ZRNO; osnivač se broji zasebno. */
  cuvar: {
    ...VERIFIKOVAN_NE_OSNIVAC,
    potvrdjenAt: { not: null },
    tipKorisnika: TipKorisnika.NOSILAC_ZRNA,
  },
  /** Osnivač (dokaz stvarnosti čl. 14, 15; Pravilnik čl. 82). */
  osnivac: { ...PUNOLETAN, ...OSNIVAC_ZIV },
} satisfies Record<string, Prisma.UserWhereInput>;

/** Živ roditelj: nalog roditelja radi (nije ugašen ni isključen). */
const ZIV_RODITELJ = {
  roditeljstvaKaoDete: { some: { roditelj: { status: UserStatus.ACTIVE, deaktiviranAt: null } } },
} satisfies Prisma.UserWhereInput;

/**
 * Deca po stanju (Pravilnik o učešću dece čl. 4c). Dete Kola je `USLOV_AKTIVNO_DETE`
 * (`protokol/skole.ts`) — isti uslov kojim se dete broji svuda, ne kopija.
 */
export const USLOVI_DECE = {
  naCekanju: { maloletan: true, NOT: ZIV_RODITELJ },
  saRoditeljem: { maloletan: true, ...ZIV_RODITELJ, NOT: USLOV_AKTIVNO_DETE },
  kola: USLOV_AKTIVNO_DETE,
} satisfies Record<string, Prisma.UserWhereInput>;

/**
 * Broj učesnika po statusu iz akata (set 4.8.2). Podrazumevano nad registrovanim
 * nalozima (`deaktiviranAt: null`, isto kao admin kartice); za merenje stanja sistema
 * pozivalac daje uslov aktivnog naloga (`docs/merenje-stanja.md`).
 *
 * 🔴 Dete se nikad ne broji među korisnicima ni članovima — ima sopstvenu kolonu.
 */
export async function brojeviStatusa(uslovNaloga: Prisma.UserWhereInput = { deaktiviranAt: null }) {
  const n = (w: Prisma.UserWhereInput) => prisma.user.count({ where: { AND: [uslovNaloga, w] } });
  const [korisnici, bezPotvrde, clanoviKola, cuvari, osnivaci, naCekanju, saRoditeljem, kola] = await Promise.all([
    n(USLOVI_STATUSA.korisnik),
    n(USLOVI_STATUSA.bezPotvrde),
    n(USLOVI_STATUSA.clanKola),
    n(USLOVI_STATUSA.cuvar),
    n(USLOVI_STATUSA.osnivac),
    n(USLOVI_DECE.naCekanju),
    n(USLOVI_DECE.saRoditeljem),
    n(USLOVI_DECE.kola),
  ]);
  return { korisnici, bezPotvrde, clanoviKola, cuvari, osnivaci, deca: { naCekanju, saRoditeljem, kola } };
}

export type BrojeviStatusa = Awaited<ReturnType<typeof brojeviStatusa>>;
