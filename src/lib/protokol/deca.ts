/**
 * Modul Deca — servisne funkcije (Pravilnik o učešću dece, v4.8.2).
 *
 * Re-eksportuje čista pravila iz `src/lib/deca-pravila.ts`, pa server ima jedan
 * ulaz. Pretraživač uvozi pravila neposredno — ovaj modul povlači Prisma klijent.
 *
 * ─── Dva ulaza u modul ──────────────────────────────────────────────────────
 *
 *  1. **Roditelj otvara nalog iz svog profila** (čl. 4). Otvara ga SVAKI punoletni
 *     učesnik koji izjavi da je roditelj; potvrđenost nije uslov (čl. 5 st. 1).
 *     Nalog je odmah „dete sa roditeljem" (`POVEZANO`). Ovde.
 *  2. **Dete se registruje samo** (čl. 4a–4c), pre nego što je iko od njegovih
 *     roditelja na platformi. Nalog počinje na `NA_CEKANJU`. Vidi
 *     `src/lib/protokol/deca-poziv.ts`.
 *
 * ─── Dete Kola (čl. 4c t. 3, 5, 6) ─────────────────────────────────────────
 *
 * U „dete Kola" (`AKTIVNO`) nalog prelazi sam, kad je bar jedan roditelj član Kola
 * ili osnivač i NJEMU je postojanje deteta potvrđeno. Potvrdu roditelj traži sam
 * (`zatraziPotvrduPostojanja`), za svako dete posebno, bez roka; daje je član Kola
 * ili osnivač koji ga lično zna (`potvrdiPostojanje`), bez POEN-a. Postupak od
 * šezdeset dana, podsetnici, poništenje potvrde stvarnosti roditelja zbog
 * neaktivnosti i postupak Fondacije za roditelja potvrđenog uplatom su UKINUTI
 * (set 4.8.2); tabele `RoditeljstvoPotvrda` i `RoditeljstvoPotvrdaFondacije`
 * ostaju kao istorija i nemaju novih upisa.
 */
import { prisma } from "@/lib/prisma";
import { Prisma, TipKorisnika, TransactionType, UserStatus, WalletType } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { poljaPseudonima } from "@/lib/pseudonim";
import { beogradskiDan } from "./obracunski-dan";
import { generisiIzjavuRoditelja, generisiSaglasnostRoditelja } from "@/lib/deca-izjava";
import bcrypt from "bcryptjs";
import { obavesti } from "@/lib/notifikacije";
import { USLOV_AKTIVNO_DETE } from "./skole";
import {
  jeCuvar,
  potvrdjenIzPolja,
  statusUcesnika,
} from "@/lib/status-ucesnika-pravila";
import {
  PORUKA_CEKA_RODITELJA,
  UZRAST_SA_ODRASLIMA,
  granicaDatumaZaUzrast,
  naStaSeCeka,
  posmatracKaoGost,
  roditeljStanjeIzPolja,
  smeSaOdraslima,
  smeDaVidiProfilDeteta,
  stanjeDeteta,
  uzrast,
  uzrastZaModul,
  type NaStaSeCeka,
  type RoditeljStanje,
  type StanjeDeteta,
  type Ucesnik,
  MIN_LOZINKA,
} from "@/lib/deca-pravila";

export * from "@/lib/deca-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export class DecaGreska extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Polja koja opisuju maloletni nalog. 🔴 Jedino mesto koje ih upisuje.
 *
 * `datumRodjenja` sme da bude `null` — dete koje se registrovalo samo ga ne unosi,
 * upisuje ga roditelj pri preuzimanju (čl. 7). Veza sa roditeljem NIJE ovde: ona
 * živi u tabeli `Roditeljstvo`, jer roditelja može biti dvoje.
 */
export function poljaDeteta(datumRodjenja: Date | null) {
  return { datumRodjenja, maloletan: true };
}

/** Izbor polja dovoljan da se od korisnika napravi `Ucesnik`. */
export const IZBOR_UCESNIKA = {
  id: true,
  maloletan: true,
  datumRodjenja: true,
  dozvolaOdrasli: true,
  skolaSifra: true,
  roditeljstvaKaoDete: {
    select: {
      roditeljId: true,
      zaustavljenaAt: true,
      createdAt: true,
      roditelj: {
        select: {
          maloletan: true,
          jeOsnivac: true,
          verified: true,
          indeksStvarnosti: true,
          potvrdjenAt: true,
          status: true,
          deaktiviranAt: true,
        },
      },
      // Živa potvrda postojanja deteta ZA OVU vezu (čl. 6). Potvrda data drugom
      // roditelju ne prelazi na ovog.
      potvrdePostojanja: {
        where: { potvrdjenoAt: { not: null }, ponistenaAt: null },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  },
} as const satisfies Prisma.UserSelect;

type RedRoditeljstva = {
  roditeljId: string;
  zaustavljenaAt: Date | null;
  roditelj: {
    maloletan: boolean;
    jeOsnivac: boolean;
    verified: boolean;
    indeksStvarnosti: number;
    potvrdjenAt: Date | null;
    status: UserStatus;
    deaktiviranAt: Date | null;
  };
  potvrdePostojanja: { id: string }[];
};

type RedUcesnika = {
  id: string;
  maloletan: boolean;
  datumRodjenja: Date | null;
  dozvolaOdrasli: boolean;
  skolaSifra: string | null;
  roditeljstvaKaoDete: RedRoditeljstva[];
};

/** Položaj svakog roditelja iz reda baze (čl. 4c, 5, 6, 4e). */
export function roditeljiIzReda(red: Pick<RedUcesnika, "roditeljstvaKaoDete">): RoditeljStanje[] {
  return red.roditeljstvaKaoDete.map((r) =>
    roditeljStanjeIzPolja({
      aktivan: !r.roditelj.deaktiviranAt && r.roditelj.status === UserStatus.ACTIVE,
      zaustavljenaAt: r.zaustavljenaAt,
      postojanjePotvrdjeno: r.potvrdePostojanja.length > 0,
      roditelj: r.roditelj,
    }),
  );
}

/** Od reda iz baze pravi `Ucesnik` — jedino mesto koje izvodi stanje naloga. */
export function ucesnikIzReda(red: RedUcesnika): Ucesnik {
  return {
    id: red.id,
    maloletan: red.maloletan,
    // Uzrast nosi razvrstavanje iz čl. 12. Kod deteta koje čeka preuzimanje datum
    // još ne postoji (upisuje ga roditelj, čl. 7), pa ostaje `null` — a `null` po
    // `smeSaOdraslima` pada na stroži režim, što je ovde ispravno.
    godine: red.maloletan && red.datumRodjenja ? uzrast(red.datumRodjenja, beogradskiDan()) : null,
    dozvolaOdrasli: red.dozvolaOdrasli,
    skolaSifra: red.skolaSifra,
    // 🔴 Lice čija je veza zaustavljena po prijavi nema ovlašćenja roditelja ni uvid
    // (čl. 4e st. 2), pa ga pravila ovlašćenja ne vide kao roditelja.
    roditeljIds: red.roditeljstvaKaoDete.filter((r) => !r.zaustavljenaAt).map((r) => r.roditeljId),
    // Punoletan korisnik nema stanje — `AKTIVNO` je jedina vrednost koja ništa ne
    // ograničava, pa se ostatak koda ne mora granati na „je li ovo dete".
    stanje: red.maloletan ? stanjeDeteta(roditeljiIzReda(red)) : "AKTIVNO",
  };
}

/** Učitava najmanji oblik korisnika potreban za odluke ovog modula. */
export async function ucitajUcesnika(userId: string): Promise<Ucesnik | null> {
  const red = await prisma.user.findUnique({ where: { id: userId }, select: IZBOR_UCESNIKA });
  return red ? ucesnikIzReda(red) : null;
}

/** Stanje naloga (čl. 4c). Za punoletni nalog uvek `AKTIVNO`. */
export async function stanjeNaloga(userId: string): Promise<StanjeDeteta> {
  return (await ucitajUcesnika(userId))?.stanje ?? "NA_CEKANJU";
}

/**
 * Baca ako nalog još čeka roditelja (čl. 4c t. 1). Za radnje koje traže dete Kola
 * (objava, prepis) proverava se `smeObjavitiOglas`/`smePrepis`.
 *
 * 🟡 Stanje nije `UserStatus`, pa ga osvežavanje JWT tokena ne hvata samo od sebe
 * kao suspenziju. Zato se proverava u samim rutama, a ne oslanja na sesiju.
 */
export async function zaustaviAkoCekaRoditelja(userId: string) {
  if ((await stanjeNaloga(userId)) === "NA_CEKANJU") {
    throw new DecaGreska(PORUKA_CEKA_RODITELJA, 403);
  }
}

/**
 * Prodavac čiji se oglas prikazuje (čl. 13 st. 4).
 *
 * Punoletan nalog ovaj uslov ne dodiruje. Maloletni mora biti dete Kola: oglas
 * objavljuje samo dete Kola, a kad nalog pređe u „dete sa roditeljem" (čl. 20),
 * njegovi oglasi se ne prikazuju dok ponovo ne postane dete Kola — ništa se ne briše.
 *
 * 🔴 Uslov za dete je `USLOV_AKTIVNO_DETE` iz `skole.ts`, Prisma prevod
 * `stanjeDeteta() === "AKTIVNO"` — jedan izvor, ne kopija.
 */
export const USLOV_PRODAVAC_RADI = {
  OR: [{ maloletan: false }, USLOV_AKTIVNO_DETE],
} satisfies Prisma.UserWhereInput;

/**
 * Uslov nad prodavcem koji sprovodi vidljivost oglasa iz čl. 13.
 *
 * 🔴 Gost NIKADA ne vidi oglas maloletnog korisnika, i to je jedini deo koji važi
 * uvek — cena mu je nula, a cena propuštanja je izlaganje
 * deteta.
 */
export function usloviVidljivostiOglasa(posmatracUlaz: Ucesnik | null) {
  // Dete na čekanju vidi Pijacu kao neprijavljen posetilac (čl. 4c t. 1, 13 st. 4).
  const posmatrac = posmatracKaoGost(posmatracUlaz);
  if (!posmatrac) return { AND: [USLOV_PRODAVAC_RADI, { maloletan: false }] };

  if (posmatrac.maloletan) {
    return {
      AND: [
        USLOV_PRODAVAC_RADI,
        {
          OR: [
            { maloletan: true },
            // Oglase punoletnih dete vidi tek uz saglasnost roditelja i tek od 15.
            // godine — vidi obrazloženje uz `smeDaVidiOglas` u `deca-pravila.ts`.
            ...(smeSaOdraslima(posmatrac) && posmatrac.dozvolaOdrasli
              ? [{ maloletan: false }]
              : []),
          ],
        },
      ],
    };
  }

  return {
    AND: [
      USLOV_PRODAVAC_RADI,
      {
        OR: [
          { maloletan: false },
          // 🔴 Uzrasni uslov MORA biti i u upitu, ne samo u `smeDaVidiOglas`: spisak
          // na Pijaci se diže jednim `findMany`, pa bi bez njega oglas deteta do 15
          // izašao punoletnom posmatraču i pre nego što ijedna čista funkcija stigne
          // da ga odbije.
          {
            maloletan: true,
            dozvolaOdrasli: true,
            datumRodjenja: { lte: granicaDatumaZaUzrast(UZRAST_SA_ODRASLIMA, beogradskiDan()) },
          },
          // Sopstveno dete roditelj vidi i kad je prekidač isključen.
          // Zaustavljena veza ne daje uvid (čl. 4e st. 2).
          {
            maloletan: true,
            roditeljstvaKaoDete: { some: { roditeljId: posmatrac.id, zaustavljenaAt: null } },
          },
        ],
      },
    ],
  };
}

// ── Otvaranje naloga iz roditeljskog profila (čl. 4–6) ───────────────────────

export type OtvaranjeUlaz = {
  roditeljId: string;
  pseudonim: string;
  passwordHash: string;
  datumRodjenja: Date;
  memberHash: string;
};

/**
 * Otvara nalog maloletnog učesnika (čl. 4, 5, 6 st. 1).
 *
 * 🔴 Otvara ga SVAKI punoletni učesnik koji izjavi da je roditelj — i korisnik i
 * član bez potvrde; potvrđenost roditelja nije uslov (čl. 4 st. 1, 5 st. 1). Nalog
 * je odmah „dete sa roditeljem". Roditelju koji je član Kola ili osnivač ekran nudi
 * „Zatraži potvrdu da imaš dete" (`zatraziPotvrduPostojanja`).
 *
 * Sve u JEDNOJ transakciji: nalog, veza sa roditeljem, izjava i saglasnost.
 */
export async function otvoriNalogDeteta(ulaz: OtvaranjeUlaz) {
  const roditelj = await prisma.user.findUnique({
    where: { id: ulaz.roditeljId },
    select: {
      id: true,
      pseudonim: true,
      email: true,
      maloletan: true,
      status: true,
      deaktiviranAt: true,
      jezik: true,
    },
  });
  if (!roditelj) throw new DecaGreska("Nalog ne postoji.", 401);
  if (roditelj.maloletan)
    throw new DecaGreska("Dete ne može otvoriti nalog detetu.", 403);
  if (roditelj.status !== UserStatus.ACTIVE || roditelj.deaktiviranAt)
    throw new DecaGreska("Nalog nije aktivan.", 403);

  const godine = uzrast(ulaz.datumRodjenja, beogradskiDan());
  const dozvoljen = uzrastZaModul(godine);
  if (!dozvoljen.ok) throw new DecaGreska(dozvoljen.razlog, dozvoljen.status);

  const sada = new Date();
  // Kod kojim ulazi DRUGI roditelj (čl. 4b st. 6). Nastaje i ovde, iako poziva
  // nema — inače bi drugi roditelj mogao da uđe samo kod dece koja su se
  // registrovala sama, što je razlika bez razloga.
  const { poljaPozivaZaRoditeljskiUlaz } = await import("./deca-poziv");
  const roditeljEmail = roditelj.email;

  const dete = await prisma.$transaction(async (tx) => {
    const kreirano = await tx.user.create({
      data: {
        ...poljaPseudonima(ulaz.pseudonim),
        passwordHash: ulaz.passwordHash,
        memberHash: ulaz.memberHash,
        // Maloletni korisnik ostaje NEVERIFIKOVAN: nema indeks stvarnosti i nikoga
        // ne potvrđuje (čl. 15). Time sve zatečene brane sistema — ZRNO, glasanje,
        // nadzor, programi — važe za njega bez ijedne nove provere.
        tipKorisnika: TipKorisnika.NEVERIFIKOVAN,
        ...poljaDeteta(ulaz.datumRodjenja),
        roditeljstvaKaoDete: { create: { roditeljId: roditelj.id } },
        roditeljPoziv: { create: poljaPozivaZaRoditeljskiUlaz(roditeljEmail, sada) },
        // Vodič se prikazuje pri prvoj prijavi, kao i svakom novom nalogu.
        vodicVidjenAt: null,
        wallet: { create: { type: WalletType.USER, balance: 0 } },
      },
      select: { id: true, pseudonim: true },
    });

    // Izjava roditelja (čl. 6 st. 1) nastaje ODMAH: otvaranje naloga je upravo
    // radnja kojom roditelj preuzima odgovornost, pa nema šta da čeka rok. Tekst
    // se snima i posle toga se ne menja.
    await tx.roditeljstvo.update({
      where: { deteId_roditeljId: { deteId: kreirano.id, roditeljId: roditelj.id } },
      data: {
        izjavaAt: sada,
        izjavaTekst: generisiIzjavuRoditelja({ pseudonimDeteta: kreirano.pseudonim, godine }),
        // Saglasnost na obradu podataka deteta (ZZPL čl. 16) — ODVOJENA od izjave
        // iznad, iako se daje istim potezom. Vidi `deca-izjava.ts` (R-06).
        saglasnostAt: sada,
        saglasnostTekst: generisiSaglasnostRoditelja(
          { pseudonimDeteta: kreirano.pseudonim },
          roditelj.jezik ?? "sr",
        ),
      },
    });

    return kreirano;
  });

  // Roditelju koji je član Kola ili osnivač nalog ne postaje dete Kola sam od sebe:
  // potvrdu postojanja traži roditelj (čl. 6 st. 2). Obaveštenje ga na to upućuje.
  await javiDaZatraziPotvrdu(roditelj.id).catch(() => {});

  return { id: dete.id, pseudonim: dete.pseudonim, stanje: "POVEZANO" as StanjeDeteta };
}

// ── Prekidač i uklanjanje (čl. 10) ────────────────────────────────────────────

/**
 * Provera da je nalog upravo dete tog roditelja; baca ako nije.
 *
 * 🔴 Oba roditelja prolaze isti test — nema „prvog" i „drugog". Ovlašćenja iz
 * čl. 10 (prekidač, uklanjanje oglasa, uvid, brisanje) su im jednaka.
 *
 * 🔴 Zaustavljena veza (čl. 4e st. 2) ne daje ni uvid ni ovlašćenja.
 */
export async function mojeDeteIliBaci(roditeljId: string, deteId: string) {
  const dete = await prisma.user.findUnique({
    where: { id: deteId },
    select: {
      id: true,
      pseudonim: true,
      maloletan: true,
      deaktiviranAt: true,
      roditeljstvaKaoDete: { select: { roditeljId: true, zaustavljenaAt: true } },
    },
  });
  const jeMoje =
    dete?.roditeljstvaKaoDete.some((r) => r.roditeljId === roditeljId && !r.zaustavljenaAt) ?? false;
  if (!dete || !dete.maloletan || !jeMoje || dete.deaktiviranAt) {
    // 404, ne 403 — status 403 bi potvrdio da nalog postoji.
    throw new DecaGreska("Nalog nije pronađen.", 404);
  }
  return dete;
}

/** Prekidač iz čl. 10 st. 2 — komunikacija i razmena sa punoletnim korisnicima. */
export async function postaviDozvolu(roditeljId: string, deteId: string, dozvola: boolean) {
  await mojeDeteIliBaci(roditeljId, deteId);
  await prisma.user.update({ where: { id: deteId }, data: { dozvolaOdrasli: dozvola } });
  return { dozvolaOdrasli: dozvola };
}

/**
 * Nova lozinka detetu, na zahtev roditelja (čl. 10 st. 1).
 *
 * ─── Zašto ovo mora da postoji ──────────────────────────────────────────────
 *
 * Nalog maloletnog korisnika po pravilu nema imejl (čl. 4a — dete unosi adresu
 * SVOG RODITELJA, koja se ne upisuje u `User.email`). Tok „zaboravljena lozinka"
 * traži imejl, pa detetu bez adrese ne stoji na raspolaganju: zaboravljena lozinka
 * je do ove izmene značila trajno zaključan nalog, sa svim prijateljstvima i
 * POEN-om u njemu. Drugi izlaz — da dete sámo upiše i potvrdi svoju adresu — radi
 * samo za stariju decu; ovaj radi uvek.
 *
 * 🔴 Stara lozinka se NE traži i ne može da se traži: roditelj je ne zna, u tome i
 * jeste stvar. Zaštitu nosi to što radnju izvodi isključivo roditelj tog deteta,
 * prijavljen na sopstveni nalog (`mojeDeteIliBaci`).
 *
 * Dete o promeni dobija obaveštenje. Bez njega bi mu nalog prestao da radi bez
 * ijednog traga o tome zašto — a lozinku koju je zapamtilo više ne bi mogao da
 * upotrebi ni ono ni bilo ko drugi.
 */
export async function postaviLozinkuDeteta(
  roditeljId: string,
  deteId: string,
  lozinka: unknown
) {
  const dete = await mojeDeteIliBaci(roditeljId, deteId);
  if (typeof lozinka !== "string" || lozinka.length < MIN_LOZINKA) {
    throw new DecaGreska(`Lozinka mora imati najmanje ${MIN_LOZINKA} znakova.`, 400);
  }

  // 🔴 Ovlašćenje prestaje čim dete upiše i potvrdi SOPSTVENU adresu (čl. 7a):
  // tada mu je put oporavka sopstveni i roditelju ovo dugme više ne treba, a
  // ostavljeno bi značilo da roditelj u svakom trenutku preuzima nalog deteta —
  // uključujući sedamnaestogodišnjaka sa sopstvenom lozinkom. Kad je pristup
  // zaista izgubljen, put je prigovor o kome odlučuje Fondacija (čl. 10 st. 3).
  const sopstvenaAdresa = await prisma.user.findUnique({
    where: { id: dete.id },
    select: { email: true },
  });
  if (sopstvenaAdresa?.email) {
    throw new DecaGreska(PORUKA_LOZINKA_IMA_ADRESU, 403);
  }

  const passwordHash = await bcrypt.hash(lozinka, 12);
  await prisma.user.update({ where: { id: dete.id }, data: { passwordHash } });

  await obavesti(dete.id, {
    tip: "lozinka_promenio_roditelj",
    kljuc: "notifikacije.lozinka_promenio_roditelj",
    parametri: {},
    naslov: "Roditelj ti je postavio novu lozinku",
    tekst: "Pitaj ga koja je nova lozinka i prijavi se njome.",
    link: "/pocetna",
  }).catch(() => {});

  return { ok: true };
}

/**
 * Uklanjanje oglasa deteta (čl. 10 st. 1) — jedno od ovlašćenja uklanjanja koje
 * roditelj ima. Meko, kao i moderacija Fondacije: oglas nestaje iz svih prikaza,
 * a trag ko ga je i kada uklonio ostaje.
 */
export async function ukloniOglasDeteta(roditeljId: string, deteId: string, oglasId: string) {
  const dete = await mojeDeteIliBaci(roditeljId, deteId);
  const izmenjeno = await prisma.marketplaceListing.updateMany({
    where: { id: oglasId, sellerId: dete.id, uklonjenAt: null },
    data: {
      uklonjenAt: new Date(),
      uklonioId: roditeljId,
      uklonjenRazlog: "Uklonio roditelj (Pravilnik o Modulu Deca, čl. 10 st. 1)",
      status: "UKLONJEN",
    },
  });
  if (izmenjeno.count === 0) throw new DecaGreska("Oglas nije pronađen.", 404);

  await obavesti(dete.id, {
    tip: "oglas_uklonjen_roditelj",
    kljuc: "notifikacije.oglas_uklonio_roditelj",
    parametri: {},
    naslov: "Roditelj je uklonio tvoj oglas",
    tekst: "Tvoj oglas je uklonjen sa Pijace.",
    link: "/profil/oglasi",
  }).catch(() => {});

  return { ok: true };
}

/**
 * Razgovori deteta SA PUNOLETNIM LICIMA — roditelj ih čita (čl. 9).
 *
 * 🔴 IZMENA U ODNOSU NA PRVU VERZIJU: razgovore između dece roditelj VIŠE NE ČITA.
 * Nadzor nad dečjim razgovorom dodiruje i tuđe dete — poruke drugog deteta čitao bi
 * neko ko u razgovoru ne učestvuje i kome njegov roditelj ništa nije dozvolio. To je
 * bilo najteže mesto za procenu uticaja i za Politiku privatnosti; kad roditelj ne
 * čita, problem nestaje ceo. Umesto sadržaja roditelj vidi KO i KOLIKO (vidi
 * `dohvatiPregledDeteta`).
 *
 * 🔴 Roditelj SAMO ČITA. Ne piše u razgovor: sa druge strane je odrastao čovek, a
 * taj odnos otvara isključivo prekidač iz čl. 10. Punoletnom sagovorniku u razgovoru
 * stoji vidljiv natpis da razgovor čita roditelj — to je i odvraćanje i poštenje.
 */
export async function dohvatiRazgovoreDeteta(roditeljId: string, deteId: string) {
  const dete = await mojeDeteIliBaci(roditeljId, deteId);

  const konverzacije = await prisma.konverzacija.findMany({
    where: {
      OR: [
        { user1Id: dete.id, user2: { maloletan: false } },
        { user2Id: dete.id, user1: { maloletan: false } },
      ],
    },
    orderBy: { lastMessageAt: "desc" },
    take: 30,
    select: {
      id: true,
      lastMessageAt: true,
      user1: { select: { id: true, pseudonim: true } },
      user2: { select: { id: true, pseudonim: true } },
      poruke: {
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, tekst: true, posiljacId: true, createdAt: true },
      },
    },
  });

  return konverzacije.map((k) => {
    const drugi = k.user1.id === dete.id ? k.user2 : k.user1;
    return {
      id: k.id,
      drugi: drugi.pseudonim,
      drugiId: drugi.id,
      poslednja: k.lastMessageAt.toISOString(),
      poruke: k.poruke.map((p) => ({
        id: p.id,
        tekst: p.tekst,
        odDeteta: p.posiljacId === dete.id,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  });
}

/**
 * Šta roditelj vidi umesto sadržaja razgovora među decom (čl. 9 st. 2): KO i KOLIKO.
 *
 * Spisak prijatelja sa datumima i spisak razgovora bez ijedne poruke. Uz to
 * istorija prepisa i oglasi stoje na svojim mestima, kao i do sada.
 */
export async function dohvatiPregledDeteta(roditeljId: string, deteId: string) {
  const dete = await mojeDeteIliBaci(roditeljId, deteId);

  const [prijateljstva, konverzacije] = await Promise.all([
    prisma.prijateljstvo.findMany({
      where: { OR: [{ aId: dete.id }, { bId: dete.id }], raskinutAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        poenEvidentiran: true,
        a: { select: { id: true, pseudonim: true, deaktiviranAt: true } },
        b: { select: { id: true, pseudonim: true, deaktiviranAt: true } },
      },
    }),
    prisma.konverzacija.findMany({
      where: {
        OR: [
          { user1Id: dete.id, user2: { maloletan: true } },
          { user2Id: dete.id, user1: { maloletan: true } },
        ],
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true,
        lastMessageAt: true,
        user1: { select: { id: true, pseudonim: true } },
        user2: { select: { id: true, pseudonim: true } },
        _count: { select: { poruke: true } },
      },
    }),
  ]);

  return {
    prijatelji: prijateljstva
      .map((p) => ({
        drugi: p.a.id === dete.id ? p.b : p.a,
        createdAt: p.createdAt,
        poenEvidentiran: p.poenEvidentiran,
      }))
      .filter((p) => !p.drugi.deaktiviranAt)
      .map((p) => ({
        pseudonim: p.drugi.pseudonim,
        od: p.createdAt.toISOString(),
        poenEvidentiran: p.poenEvidentiran,
      })),
    // 🔴 Bez ijedne poruke — samo sa kim i kada. Sadržaj razgovora među decom
    // roditelj ne vidi.
    razgovori: konverzacije.map((k) => ({
      id: k.id,
      drugi: (k.user1.id === dete.id ? k.user2 : k.user1).pseudonim,
      poruka: k._count.poruke,
      poslednja: k.lastMessageAt.toISOString(),
    })),
  };
}

// ── Brisanje naloga (čl. 17) ─────────────────────────────────────────────────

/**
 * Roditelj briše nalog svog deteta. Poništavaju se svi zapisi POEN-a uz protivzapis
 * Protokola i uklanjaju se svi oglasi.
 *
 * Nalog se anonimizuje i deaktivira, a ne briše iz baze — isti postupak kao pri
 * prestanku statusa punoletnog korisnika (čl. 34 Pravilnika o KOLO sistemu).
 * Numerička istorija transakcija ostaje, jer bez nje zero-sum ne bi mogao da se
 * proveri; napušteni pseudonim se briše, pa ime postaje ponovo slobodno.
 */
export async function obrisiNalogDeteta(roditeljId: string, deteId: string) {
  const dete = await mojeDeteIliBaci(roditeljId, deteId);
  return obrisiDecjiNalog(dete.id, dete.pseudonim, roditeljId, "Modul Deca, čl. 17");
}

/**
 * Jezgro brisanja dečjeg naloga. Zove ga i roditelj (čl. 17) i noćni posao koji
 * uklanja naloge koje niko nije preuzeo u roku od četrnaest dana (čl. 4b st. 5).
 */
export async function obrisiDecjiNalog(
  deteId: string,
  pseudonim: string,
  uklonioId: string | null,
  osnov: string
) {
  await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.findUnique({ where: { userId: deteId } });
    const balans = w?.balance ?? 0;
    // 🔴 `increment: balans` pokriva i NEGATIVNO stanje. Dečji zapis sme u minus
    // (raskid prijateljstva, čl. 14c st. 3), pa nulovanje takvog zapisa dodaje POEN
    // u sistem i Protokol mora da ide dublje u minus, ne plići. Uslov `> 0` bi tada
    // tiho oborio zero-sum.
    if (w && balans !== 0) {
      await tx.wallet.update({ where: { id: w.id }, data: { balance: 0 } });
      await tx.wallet.update({
        where: { id: PROTOKOL_WALLET_ID },
        data: { balance: { increment: balans } },
      });
      await tx.transaction.create({
        data: {
          fromWalletId: balans > 0 ? w.id : PROTOKOL_WALLET_ID,
          toWalletId: balans > 0 ? PROTOKOL_WALLET_ID : w.id,
          amount: Math.abs(balans),
          type: TransactionType.PONISTENJE_ZAPISA,
          description: `Poništavanje POENA pri brisanju naloga deteta (${osnov})`,
        },
      });
    }

    await tx.marketplaceListing.updateMany({
      where: { sellerId: deteId, uklonjenAt: null },
      data: {
        uklonjenAt: new Date(),
        uklonioId,
        uklonjenRazlog: `Brisanje naloga deteta (${osnov})`,
        status: "UKLONJEN",
      },
    });

    // Stari postupak potvrde (do seta 4.8.2) gubi predmet — zapisi koji još čekaju
    // se brišu. Potvrde postojanja (čl. 6) padaju kaskadno sa vezom roditelja ispod.
    await tx.roditeljstvoPotvrda.deleteMany({ where: { deteId, status: "CEKA" } });

    // Prijateljstva se brišu bez otpisa: POEN je upravo poništen u celini, pa bi
    // otpis po prijateljstvu isti iznos oduzeo dvaput. Druga strana zadržava svojih
    // 500 — nije ona ta koja odlazi.
    await tx.prijateljstvo.deleteMany({ where: { OR: [{ aId: deteId }, { bId: deteId }] } });
    await tx.prijateljToken.deleteMany({ where: { korisnikId: deteId } });
    await tx.roditeljstvo.deleteMany({ where: { deteId } });
    await tx.roditeljPoziv.deleteMany({ where: { deteId } });

    await tx.verifikacijaToken.deleteMany({ where: { korisnikId: deteId } });
    await tx.passwordResetToken.deleteMany({ where: { userId: deteId } });
    await tx.aktivnostLog.deleteMany({ where: { userId: deteId } });
    await tx.pseudonimIstorija.deleteMany({ where: { userId: deteId } });

    await tx.user.update({
      where: { id: deteId },
      data: {
        email: null,
        passwordHash: null,
        ...poljaPseudonima(`obrisani-korisnik-${deteId.slice(0, 8)}`),
        telefon: null,
        location: null,
        avatar: null,
        datumRodjenja: null,
        maloletan: false,
        dozvolaOdrasli: false,
        status: UserStatus.EXCLUDED,
        deaktiviranAt: new Date(),
      },
    });
  });

  return { ok: true, pseudonim };
}

// ── Izjava roditelja i potvrda postojanja deteta (čl. 6, set 4.8.2) ──────────

/**
 * Zašto roditelj ne postavlja lozinku detetu koje ima svoju adresu (čl. 10 st. 3).
 * Poruka imenuje i izlaz — inače saopštava samo zabranu.
 */
export const PORUKA_LOZINKA_IMA_ADRESU =
  "Dete je upisalo svoju elektronsku adresu, pa lozinku postavlja samo ono — kroz postupak za zaboravljenu lozinku. Ako je pristup stvarno izgubljen, podnesi prigovor sa svog profila; odlučuje Fondacija.";

/** Poruka roditelju koji nije član Kola, a traži potvrdu postojanja (čl. 6 st. 2). */
export const PORUKA_POTVRDU_TRAZI_CLAN_KOLA =
  "Potvrdu da imaš dete traži roditelj koji je član Kola.";

/** Poruka onome ko nije član Kola, a pokušava da potvrdi postojanje deteta (čl. 6 st. 4). */
export const PORUKA_POSTOJANJE_POTVRDJUJE_CLAN_KOLA =
  "Postojanje deteta potvrđuje član Kola koji roditelja lično zna.";

/**
 * Izjava roditelja o postojanju deteta (čl. 6 st. 1), kad je nije dao pri
 * otvaranju odnosno preuzimanju naloga.
 *
 * Jedini takav slučaj je administrativno prevođenje punoletnog naloga u maloletni
 * (čl. 4d): roditelj izjavu daje po prijemu odluke o prevođenju. 🔴 Od seta 4.8.2
 * izjava NEMA rok i izostanak nema posledicu po treća lica — potvrde stvarnosti
 * roditelja se zbog nje ne diraju.
 */
export async function dajIzjavuRoditelja(roditeljId: string, deteId: string) {
  const veza = await prisma.roditeljstvo.findUnique({
    where: { deteId_roditeljId: { deteId, roditeljId } },
    select: {
      id: true,
      izjavaAt: true,
      zaustavljenaAt: true,
      dete: { select: { pseudonim: true, datumRodjenja: true } },
      roditelj: { select: { jezik: true } },
    },
  });
  if (!veza || veza.zaustavljenaAt) throw new DecaGreska("Nalog nije pronađen.", 404);
  if (veza.izjavaAt) return { ok: true, vecData: true };
  if (!veza.dete.datumRodjenja) throw new DecaGreska("Datum rođenja nije upisan.", 409);

  const godine = uzrast(veza.dete.datumRodjenja, beogradskiDan());
  await prisma.roditeljstvo.update({
    where: { id: veza.id },
    data: {
      izjavaAt: new Date(),
      izjavaTekst: generisiIzjavuRoditelja({
        pseudonimDeteta: veza.dete.pseudonim,
        godine,
      }),
      // Saglasnost na obradu ide istim potezom (R-06). Ovo je jedini put na kome
      // roditelj izjavu daje naknadno — pri administrativnom prevođenju naloga —
      // pa i saglasnost do tog trenutka nije postojala.
      saglasnostAt: new Date(),
      saglasnostTekst: generisiSaglasnostRoditelja(
        { pseudonimDeteta: veza.dete.pseudonim },
        veza.roditelj.jezik ?? "sr",
      ),
      izjavaRokDo: null,
    },
  });
  return { ok: true, vecData: false };
}

/** Polja roditelja/potvrdioca dovoljna za `potvrdjenIzPolja` i `statusUcesnika`. */
const IZBOR_POLOZAJA = {
  id: true,
  pseudonim: true,
  maloletan: true,
  jeOsnivac: true,
  verified: true,
  indeksStvarnosti: true,
  potvrdjenAt: true,
  tipKorisnika: true,
  status: true,
  deaktiviranAt: true,
} as const satisfies Prisma.UserSelect;

/**
 * Obaveštenje roditelju koji je član Kola ili osnivač da zatraži potvrdu
 * postojanja za decu kojoj je još nije tražio (čl. 6 st. 2 i 8). Ne baca.
 *
 * Zove se pri otvaranju i preuzimanju naloga i kad roditelj postane član Kola
 * (`posleStatusaRoditelja`). Ne šalje ništa roditelju koji nije član Kola, ni kad
 * su sva deca već obuhvaćena zahtevom ili potvrdom.
 */
export async function javiDaZatraziPotvrdu(roditeljId: string): Promise<number> {
  try {
    const roditelj = await prisma.user.findUnique({ where: { id: roditeljId }, select: IZBOR_POLOZAJA });
    if (!roditelj || roditelj.deaktiviranAt || roditelj.status !== UserStatus.ACTIVE) return 0;
    if (!potvrdjenIzPolja(roditelj)) return 0;

    const veze = await prisma.roditeljstvo.findMany({
      where: {
        roditeljId,
        zaustavljenaAt: null,
        dete: { maloletan: true, deaktiviranAt: null },
        potvrdePostojanja: { none: { aktivnaKljuc: { not: null } } },
      },
      select: { dete: { select: { id: true, pseudonim: true } } },
    });
    for (const v of veze) {
      await obavesti(roditeljId, {
        tip: "postojanje_zatrazi",
        kljuc: "notifikacije.postojanje_zatrazi",
        parametri: { pseudonim: v.dete.pseudonim },
        naslov: "Zatraži potvrdu da imaš dete",
        tekst:
          `${v.dete.pseudonim} postaje dete Kola kad član Kola koji te lično zna potvrdi da imaš to dete. ` +
          `Zahtev pošalji sa profila deteta.`,
        link: `/deca/${v.dete.id}`,
        email: false,
      }).catch(() => {});
    }
    return veze.length;
  } catch (e) {
    console.error("[deca] Poziv da se zatraži potvrda postojanja nije poslat", roditeljId, e);
    return 0;
  }
}

/**
 * Roditelj koji je član Kola ili osnivač traži potvrdu postojanja deteta (čl. 6
 * st. 2). Za svako dete posebno, bez roka. Najviše jedan živ zahtev po vezi
 * (`aktivnaKljuc = roditeljstvoId`).
 *
 * Obaveštenje (otvoreno pitanje 10 specifikacije prelaza): verifikatorima koji su
 * roditelja POTVRDILI (veza vrste POTVRDA) i članovima Kola koji su ga potvrdili kao
 * člana bez potvrde — ako su danas član Kola ili osnivač i nisu drugi roditelj istog
 * deteta. 🔴 Obaveštenje nosi ISKLJUČIVO pseudonim roditelja (čl. 6 st. 3) — bez
 * pseudonima, uzrasta, pola i škole deteta. Svi članovi Kola zahtev vide na
 * stranici Potvrde; masovno obaveštavanje se ne radi.
 */
export async function zatraziPotvrduPostojanja(roditeljId: string, deteId: string) {
  const [roditelj, veza] = await Promise.all([
    prisma.user.findUnique({ where: { id: roditeljId }, select: IZBOR_POLOZAJA }),
    prisma.roditeljstvo.findUnique({
      where: { deteId_roditeljId: { deteId, roditeljId } },
      select: {
        id: true,
        zaustavljenaAt: true,
        dete: { select: { maloletan: true, deaktiviranAt: true } },
      },
    }),
  ]);
  if (!roditelj || roditelj.deaktiviranAt || roditelj.status !== UserStatus.ACTIVE) {
    throw new DecaGreska("Nalog nije aktivan.", 403);
  }
  if (!veza || veza.zaustavljenaAt || !veza.dete.maloletan || veza.dete.deaktiviranAt) {
    throw new DecaGreska("Nalog nije pronađen.", 404);
  }
  if (!potvrdjenIzPolja(roditelj)) throw new DecaGreska(PORUKA_POTVRDU_TRAZI_CLAN_KOLA, 403);

  const postojeci = await prisma.potvrdaPostojanjaDeteta.findUnique({
    where: { aktivnaKljuc: veza.id },
    select: { id: true, potvrdjenoAt: true },
  });
  if (postojeci) return { id: postojeci.id, vecPostoji: true, potvrdjeno: postojeci.potvrdjenoAt !== null };

  let zahtevId: string;
  try {
    const nov = await prisma.potvrdaPostojanjaDeteta.create({
      data: {
        roditeljstvoId: veza.id,
        deteId,
        roditeljId,
        trazenoAt: new Date(),
        aktivnaKljuc: veza.id,
      },
      select: { id: true },
    });
    zahtevId = nov.id;
  } catch (e) {
    // Uporedan zahtev za istu vezu — jedinstveni `aktivnaKljuc` drži jedan živ red.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const red = await prisma.potvrdaPostojanjaDeteta.findUnique({
        where: { aktivnaKljuc: veza.id },
        select: { id: true, potvrdjenoAt: true },
      });
      return { id: red?.id ?? "", vecPostoji: true, potvrdjeno: red?.potvrdjenoAt != null };
    }
    throw e;
  }

  await javiMogucimPotvrdiocima(roditeljId, deteId, roditelj.pseudonim);
  return { id: zahtevId, vecPostoji: false, potvrdjeno: false };
}

/** Obaveštenje o zahtevu — samo pseudonim roditelja (čl. 6 st. 3). Ne baca. */
async function javiMogucimPotvrdiocima(roditeljId: string, deteId: string, roditeljPseudonim: string) {
  try {
    const [veze, potvrdeClana, roditeljiDeteta] = await Promise.all([
      prisma.verifikacionaVeza.findMany({
        where: { verifikovaniId: roditeljId, vrsta: "POTVRDA" },
        select: { verifikatorId: true },
      }),
      prisma.potvrdaClana.findMany({
        where: { potvrdjeniId: roditeljId, izvor: "CLAN_KOLA", aktivnaKljuc: { not: null } },
        select: { potvrdioId: true },
      }),
      prisma.roditeljstvo.findMany({ where: { deteId }, select: { roditeljId: true } }),
    ]);
    const drugiRoditelji = new Set(roditeljiDeteta.map((r) => r.roditeljId));
    const kandidati = [
      ...new Set([
        ...veze.map((v) => v.verifikatorId),
        ...potvrdeClana.map((p) => p.potvrdioId).filter((id): id is string => Boolean(id)),
      ]),
    ].filter((id) => id !== roditeljId && !drugiRoditelji.has(id));
    if (kandidati.length === 0) return;

    const ljudi = await prisma.user.findMany({ where: { id: { in: kandidati } }, select: IZBOR_POLOZAJA });
    for (const k of ljudi) {
      if (k.deaktiviranAt || k.status !== UserStatus.ACTIVE || !potvrdjenIzPolja(k)) continue;
      await obavesti(k.id, {
        tip: "postojanje_zahtev",
        kljuc: "notifikacije.postojanje_zahtev",
        parametri: { pseudonim: roditeljPseudonim },
        naslov: "Zahtev za potvrdu da član ima dete",
        tekst: `${roditeljPseudonim} traži potvrdu da ima dete. Ako ga lično znaš, zahtev je na stranici Potvrde.`,
        link: "/verifikacija#postojanje-deteta",
        email: false,
      }).catch(() => {});
    }
  } catch (e) {
    console.error("[deca] Obaveštenje o zahtevu za potvrdu postojanja nije poslato", roditeljId, e);
  }
}

/**
 * Zahtevi za potvrdu postojanja deteta koje posmatrač vidi na stranici Potvrde
 * (čl. 6 st. 3). Vidi ih SAMO član Kola ili osnivač (član bez potvrde, korisnik i
 * dete dobijaju prazan spisak — ruta vraća 403).
 *
 * 🔴 Ne prikazuju se sopstveni zahtevi ni zahtevi za decu kojoj je posmatrač
 * roditelj (drugi roditelj potvrdu ne daje, čl. 6 st. 4). Odgovor nosi ISKLJUČIVO
 * pseudonim roditelja — ni pseudonim, ni uzrast, ni pol, ni školu deteta.
 */
export async function zahteviPostojanjaZaPotvrdu(posmatracId: string) {
  const posmatrac = await prisma.user.findUnique({ where: { id: posmatracId }, select: IZBOR_POLOZAJA });
  if (!posmatrac || posmatrac.deaktiviranAt || !potvrdjenIzPolja(posmatrac)) return [];

  const redovi = await prisma.potvrdaPostojanjaDeteta.findMany({
    where: {
      aktivnaKljuc: { not: null },
      potvrdjenoAt: null,
      ponistenaAt: null,
      roditeljId: { not: posmatracId },
      roditeljstvo: { zaustavljenaAt: null },
      roditelj: { status: UserStatus.ACTIVE, deaktiviranAt: null },
      dete: {
        maloletan: true,
        deaktiviranAt: null,
        roditeljstvaKaoDete: { none: { roditeljId: posmatracId } },
      },
    },
    orderBy: { trazenoAt: "asc" },
    take: 200,
    select: {
      id: true,
      trazenoAt: true,
      roditelj: { select: { pseudonim: true } },
    },
  });
  return redovi.map((r) => ({
    id: r.id,
    roditelj: r.roditelj.pseudonim,
    trazeno: r.trazenoAt?.toISOString() ?? null,
  }));
}

/**
 * Član Kola ili osnivač potvrđuje postojanje deteta roditelja koga lično zna
 * (čl. 6 st. 4). 🔴 Bez POEN-a ikome (st. 5). Drugi roditelj istog deteta potvrdu
 * ne daje; maloletni učesnik ne potvrđuje (čl. 15).
 *
 * Nadzoru podleže kad potvrdu daje član Kola koji nije osnivač ni čuvar Kola
 * (dokaz stvarnosti čl. 10 st. 1) — isto pravilo kao `podlezeNadzoruPotvrda` za
 * izvor CLAN_KOLA. Posle upisa se osvežavaju prijateljstva deteta, jer nalog može
 * upravo postati dete Kola (čl. 14b st. 2).
 */
export async function potvrdiPostojanje(potvrdilacId: string, zahtevId: string, izjava: boolean) {
  if (izjava !== true) {
    throw new DecaGreska("Potvrda mora biti izričita.", 400);
  }
  const [potvrdilac, zahtev] = await Promise.all([
    prisma.user.findUnique({ where: { id: potvrdilacId }, select: IZBOR_POLOZAJA }),
    prisma.potvrdaPostojanjaDeteta.findUnique({
      where: { id: zahtevId },
      select: {
        id: true,
        deteId: true,
        roditeljId: true,
        potvrdjenoAt: true,
        ponistenaAt: true,
        aktivnaKljuc: true,
        roditeljstvo: { select: { zaustavljenaAt: true } },
        roditelj: { select: { pseudonim: true } },
      },
    }),
  ]);
  if (!potvrdilac || potvrdilac.deaktiviranAt || potvrdilac.status !== UserStatus.ACTIVE) {
    throw new DecaGreska("Nalog nije aktivan.", 403);
  }
  if (potvrdilac.maloletan || !potvrdjenIzPolja(potvrdilac)) {
    throw new DecaGreska(PORUKA_POSTOJANJE_POTVRDJUJE_CLAN_KOLA, 403);
  }
  if (!zahtev || !zahtev.aktivnaKljuc || zahtev.ponistenaAt || !zahtev.roditeljstvo || zahtev.roditeljstvo.zaustavljenaAt) {
    throw new DecaGreska("Zahtev nije pronađen.", 404);
  }
  if (zahtev.potvrdjenoAt) throw new DecaGreska("Postojanje deteta je već potvrđeno.", 409);
  if (zahtev.roditeljId === potvrdilacId) {
    throw new DecaGreska("Sopstveni zahtev ne potvrđuješ.", 403);
  }
  const drugiRoditelj = await prisma.roditeljstvo.findUnique({
    where: { deteId_roditeljId: { deteId: zahtev.deteId, roditeljId: potvrdilacId } },
    select: { id: true },
  });
  if (drugiRoditelj) throw new DecaGreska("Drugi roditelj istog deteta potvrdu ne daje.", 403);

  const status = statusUcesnika(potvrdilac);
  const podlezeNadzoru = !jeCuvar(status);

  const izmenjeno = await prisma.potvrdaPostojanjaDeteta.updateMany({
    where: { id: zahtev.id, potvrdjenoAt: null, ponistenaAt: null, aktivnaKljuc: { not: null } },
    data: {
      izvor: "CLAN_KOLA",
      potvrdioId: potvrdilacId,
      potvrdjenoAt: new Date(),
      podlezeNadzoru,
    },
  });
  if (izmenjeno.count === 0) throw new DecaGreska("Postojanje deteta je već potvrđeno.", 409);

  await obavesti(zahtev.roditeljId, {
    tip: "postojanje_potvrdjeno",
    kljuc: "notifikacije.postojanje_potvrdjeno",
    parametri: { pseudonim: potvrdilac.pseudonim },
    naslov: "Potvrđeno je da imaš dete",
    tekst: `${potvrdilac.pseudonim} je potvrdio da imaš dete. Tvoje dete je sada dete Kola.`,
    link: `/deca/${zahtev.deteId}`,
  }).catch(() => {});

  // Van transakcije i ne baca — emisija ima svoju (CLAUDE.md pravilo 8).
  const { osveziPrijateljstvaDeteta } = await import("./prijateljstva");
  await osveziPrijateljstvaDeteta(zahtev.deteId);

  return { ok: true, podlezeNadzoru };
}

/**
 * Poništenje potvrde postojanja deteta (čl. 6 st. 6, čl. 20; Glava VIII Pravilnika
 * o dokazu stvarnosti). Zove je odluka u nadzornom predmetu
 * (`api/admin/nadzor/predmeti/[id]/utvrdi`) i ukidanje veze po čl. 4e.
 *
 * Nalog deteta time prelazi u „dete sa roditeljem" ako uslov iz čl. 4c t. 3 ne
 * ispunjava po drugom roditelju — to se izvodi samo, ništa se ne briše (čl. 20).
 * Bez POEN-a: potvrda ga nije ni nosila.
 */
export async function ponistiPotvrduPostojanja(id: string, adminId: string) {
  const red = await prisma.potvrdaPostojanjaDeteta.findUnique({
    where: { id },
    select: { id: true, deteId: true, roditeljId: true, ponistenaAt: true },
  });
  if (!red) throw new DecaGreska("Potvrda nije pronađena.", 404);
  if (red.ponistenaAt) return { ok: true, vecPonistena: true };

  await prisma.potvrdaPostojanjaDeteta.update({
    where: { id },
    data: { ponistenaAt: new Date(), ponistioId: adminId, aktivnaKljuc: null },
  });

  await obavesti(red.roditeljId, {
    tip: "postojanje_ponisteno",
    kljuc: "notifikacije.postojanje_ponisteno",
    naslov: "Potvrda postojanja deteta je poništena",
    tekst:
      "Fondacija je poništila potvrdu da imaš dete. Nalog deteta ostaje i nijedan podatak se ne briše; " +
      "dete Kola ostaje samo ako je potvrda data drugom roditelju. Na odluku možeš uložiti prigovor sa svog profila.",
    link: `/deca/${red.deteId}`,
  }).catch(() => {});

  return { ok: true, vecPonistena: false };
}

// ── Prijava lažnog roditeljstva (čl. 4e) ─────────────────────────────────────

/** Najviše otvorenih prijava po podnosiocu — brana od zatrpavanja. */
export const MAX_OTVORENIH_PRIJAVA = 5;

/**
 * Prijava da lice koje je nalog deteta otvorilo ili preuzelo nije roditelj (čl. 4e
 * st. 1). Podnosi je maloletni učesnik, drugi roditelj ili bilo koji drugi učesnik.
 *
 * Po prijemu se veza ODMAH zaustavlja (st. 2): lice nema uvid ni ovlašćenja, a
 * prema njemu se ne ispunjava uslov za dete Kola. Zaustavljanje nije mera i ne
 * znači da je izjava neistinita.
 *
 * 🔴 Licu na koje se prijava odnosi NE otkriva se ko je prijavu podneo (st. 3) —
 * obaveštenje mu ne nosi ni id ni pseudonim podnosioca.
 *
 * 🔴 Ponovljena prijava (set 4.8.4, registar 2026-10 D4): kada je Fondacija za ovu
 * vezu već odlučila da je lice roditelj (prijava `NEMA_OSNOVA`), nova prijava se
 * prima i razmatra, ali veza se njome NE zaustavlja automatski — inače bi se
 * zaustavljanje u roditeljskom sporu moglo ponavljati bez kraja (čl. 4e poslednji stav).
 */
export async function prijaviRoditeljstvo(podnosilacId: string, roditeljstvoId: string, opis: string) {
  const tekst = typeof opis === "string" ? opis.trim() : "";
  if (tekst.length < 10) throw new DecaGreska("Opiši ukratko zašto smatraš da to lice nije roditelj.", 400);
  if (tekst.length > 2000) throw new DecaGreska("Opis može imati najviše 2000 znakova.", 400);

  const veza = await prisma.roditeljstvo.findUnique({
    where: { id: roditeljstvoId },
    select: {
      id: true,
      deteId: true,
      roditeljId: true,
      zaustavljenaAt: true,
      dete: { select: { pseudonim: true, maloletan: true, deaktiviranAt: true } },
    },
  });
  if (!veza || !veza.dete.maloletan || veza.dete.deaktiviranAt) {
    throw new DecaGreska("Nalog nije pronađen.", 404);
  }
  if (veza.roditeljId === podnosilacId) throw new DecaGreska("Ne prijavljuješ sopstvenu vezu.", 400);

  const [otvorenePodnosioca, istaVeza, vecOdluceno] = await Promise.all([
    prisma.prijavaRoditeljstva.count({ where: { podnosilacId, status: "OTVORENA" } }),
    prisma.prijavaRoditeljstva.count({ where: { podnosilacId, roditeljstvoId, status: "OTVORENA" } }),
    prisma.prijavaRoditeljstva.count({ where: { roditeljstvoId, status: "NEMA_OSNOVA" } }),
  ]);
  const zaustavi = vecOdluceno === 0;
  if (istaVeza > 0) throw new DecaGreska("Tvoja prijava za ovu vezu je već u postupku.", 409);
  if (otvorenePodnosioca >= MAX_OTVORENIH_PRIJAVA) {
    throw new DecaGreska("Imaš previše otvorenih prijava. Sačekaj odluku Fondacije.", 429);
  }

  const prijava = await prisma.$transaction(async (tx) => {
    const p = await tx.prijavaRoditeljstva.create({
      data: {
        roditeljstvoId: veza.id,
        deteId: veza.deteId,
        roditeljId: veza.roditeljId,
        podnosilacId,
        opis: tekst,
      },
      select: { id: true },
    });
    if (zaustavi) {
      await tx.roditeljstvo.updateMany({
        where: { id: veza.id, zaustavljenaAt: null },
        data: { zaustavljenaAt: new Date() },
      });
    }
    return p;
  });

  if (!zaustavi) {
    const { posaljiAdminAlert } = await import("@/lib/adminAlert");
    void posaljiAdminAlert(
      "Ponovljena prijava lažnog roditeljstva",
      `Prijava ${prijava.id}: za ovu vezu je već odlučeno da je lice roditelj, pa veza NIJE zaustavljena (čl. 4e poslednji stav). Odluka u Admin → Odluke.`,
    );
    return { id: prijava.id };
  }

  // 🔴 Bez podnosioca — ni id ni pseudonim (čl. 4e st. 3).
  await obavesti(veza.roditeljId, {
    tip: "roditeljstvo_prijava_zaustavljena",
    kljuc: "notifikacije.roditeljstvo_prijava_zaustavljena",
    parametri: { pseudonim: veza.dete.pseudonim },
    naslov: "Veza sa nalogom deteta je privremeno zaustavljena",
    tekst:
      `Fondaciji je prijavljeno da nisi roditelj deteta ${veza.dete.pseudonim}. Dok Fondacija ne odluči, ` +
      `veza je zaustavljena: nemaš uvid ni ovlašćenja roditelja. Zaustavljanje nije mera i ne znači da je tvoja izjava neistinita.`,
    link: "/profil",
  }).catch(() => {});

  const { posaljiAdminAlert } = await import("@/lib/adminAlert");
  void posaljiAdminAlert(
    "Prijava lažnog roditeljstva",
    `Prijava ${prijava.id}: veza je zaustavljena (čl. 4e st. 2). Odluka u Admin → Odluke.`,
  );

  return { id: prijava.id };
}

/** Otvorene i rešene prijave — za Admin → Odluke. Podnosilac se vidi samo ovde. */
export async function prijaveRoditeljstva(status: "OTVORENA" | "SVE" = "OTVORENA") {
  const redovi = await prisma.prijavaRoditeljstva.findMany({
    where: status === "OTVORENA" ? { status: "OTVORENA" } : {},
    orderBy: { createdAt: status === "OTVORENA" ? "asc" : "desc" },
    take: 200,
    select: {
      id: true,
      opis: true,
      status: true,
      createdAt: true,
      odlucenoAt: true,
      obrazlozenje: true,
      roditeljId: true,
      roditeljstvoId: true,
      dete: { select: { id: true, pseudonim: true } },
      podnosilac: { select: { id: true, pseudonim: true } },
    },
  });
  const roditelji = await prisma.user.findMany({
    where: { id: { in: [...new Set(redovi.map((r) => r.roditeljId))] } },
    select: { id: true, pseudonim: true },
  });
  const imena = new Map(roditelji.map((r) => [r.id, r.pseudonim]));
  return redovi.map((r) => ({
    id: r.id,
    opis: r.opis,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    odlucenoAt: r.odlucenoAt?.toISOString() ?? null,
    obrazlozenje: r.obrazlozenje,
    dete: r.dete,
    roditelj: { id: r.roditeljId, pseudonim: imena.get(r.roditeljId) ?? "" },
    podnosilac: r.podnosilac,
    vezaPostoji: r.roditeljstvoId !== null,
  }));
}

export type IshodPrijaveRoditeljstva = "NEMA_OSNOVA" | "UKINUTA";

/**
 * Odluka ovlašćenog lica Fondacije o prijavi (čl. 4e st. 3–6).
 *
 *  - `NEMA_OSNOVA` — zaustavljanje prestaje (ako za istu vezu nema druge otvorene
 *    prijave) i veza ponovo proizvodi dejstvo.
 *  - `UKINUTA` — veza se briše; potvrda postojanja deteta data tom licu prestaje da
 *    proizvodi dejstvo (poništava se; da li je bila lažna ceni se po čl. 6 st. 6);
 *    mesto roditelja se oslobađa. Ako dete ostane bez roditelja, nalog se ne briše
 *    nego prelazi u „dete na čekanju", a rok od četrnaest dana za preuzimanje teče
 *    iznova, uz nov kod (st. 4). Licu se obavezno izriče isključenje (st. 5).
 *
 * Obrazloženje je obavezno. Odluka se javlja podnosiocu i licu — licu bez
 * podnosioca. Na odluku obe strane imaju prigovor (st. 6; Uslovi čl. 37a, vrsta
 * `RODITELJSTVO`).
 */
export async function odluciOPrijaviRoditeljstva(
  adminId: string,
  prijavaId: string,
  ishod: IshodPrijaveRoditeljstva,
  obrazlozenje: string,
) {
  const razlog = typeof obrazlozenje === "string" ? obrazlozenje.trim() : "";
  if (!razlog) throw new DecaGreska("Obrazloženje je obavezno.", 400);
  if (razlog.length > 2000) throw new DecaGreska("Obrazloženje može imati najviše 2000 znakova.", 400);

  const prijava = await prisma.prijavaRoditeljstva.findUnique({
    where: { id: prijavaId },
    select: {
      id: true,
      status: true,
      roditeljstvoId: true,
      deteId: true,
      roditeljId: true,
      podnosilacId: true,
      dete: { select: { pseudonim: true } },
    },
  });
  if (!prijava) throw new DecaGreska("Prijava nije pronađena.", 404);
  if (prijava.status !== "OTVORENA") throw new DecaGreska("O prijavi je već odlučeno.", 409);

  const sada = new Date();
  let deteBezRoditelja = false;
  let ponistenaPotvrda: string | null = null;
  const podnosioci = new Set<string>([prijava.podnosilacId]);

  await prisma.$transaction(async (tx) => {
    const rezervisano = await tx.prijavaRoditeljstva.updateMany({
      where: { id: prijava.id, status: "OTVORENA" },
      data: { status: ishod, odlucioId: adminId, odlucenoAt: sada, obrazlozenje: razlog },
    });
    if (rezervisano.count === 0) throw new DecaGreska("O prijavi je već odlučeno.", 409);

    if (ishod === "NEMA_OSNOVA") {
      if (prijava.roditeljstvoId) {
        const josOtvorenih = await tx.prijavaRoditeljstva.count({
          where: { roditeljstvoId: prijava.roditeljstvoId, status: "OTVORENA" },
        });
        if (josOtvorenih === 0) {
          await tx.roditeljstvo.updateMany({
            where: { id: prijava.roditeljstvoId },
            data: { zaustavljenaAt: null },
          });
        }
      }
      return;
    }

    // UKINUTA — ista odluka rešava i ostale otvorene prijave iste veze.
    if (prijava.roditeljstvoId) {
      const ostale = await tx.prijavaRoditeljstva.findMany({
        where: { roditeljstvoId: prijava.roditeljstvoId, status: "OTVORENA" },
        select: { podnosilacId: true },
      });
      for (const o of ostale) podnosioci.add(o.podnosilacId);
      await tx.prijavaRoditeljstva.updateMany({
        where: { roditeljstvoId: prijava.roditeljstvoId, status: "OTVORENA" },
        data: { status: "UKINUTA", odlucioId: adminId, odlucenoAt: sada, obrazlozenje: razlog },
      });

      // Potvrda postojanja data tom licu prestaje da proizvodi dejstvo (st. 4).
      const potvrda = await tx.potvrdaPostojanjaDeteta.findUnique({
        where: { aktivnaKljuc: prijava.roditeljstvoId },
        select: { id: true, potvrdjenoAt: true },
      });
      if (potvrda) {
        await tx.potvrdaPostojanjaDeteta.update({
          where: { id: potvrda.id },
          data: { ponistenaAt: sada, ponistioId: adminId, aktivnaKljuc: null },
        });
        if (potvrda.potvrdjenoAt) ponistenaPotvrda = potvrda.id;
      }

      await tx.roditeljstvo.deleteMany({ where: { id: prijava.roditeljstvoId } });
    }

    const preostalo = await tx.roditeljstvo.count({ where: { deteId: prijava.deteId } });
    if (preostalo === 0) {
      deteBezRoditelja = true;
      const { poljaPozivaPoUkidanjuVeze } = await import("./deca-poziv");
      const polja = poljaPozivaPoUkidanjuVeze(sada);
      await tx.roditeljPoziv.upsert({
        where: { deteId: prijava.deteId },
        create: { deteId: prijava.deteId, email: "", ...polja },
        update: polja,
      });
    }
  });

  if (ishod === "UKINUTA") {
    const { iskljuciKorisnika } = await import("./iskljucenje");
    await iskljuciKorisnika(
      adminId,
      prijava.roditeljId,
      "Lažna izjava o roditeljstvu (Pravilnik o učešću dece čl. 4e st. 5)",
    ).catch((e) => console.error("[deca] Isključenje po čl. 4e nije izvršeno", prijava.roditeljId, e));
    if (ponistenaPotvrda) {
      const { posaljiAdminAlert } = await import("@/lib/adminAlert");
      void posaljiAdminAlert(
        "Ukinuta veza je imala potvrdu postojanja deteta",
        `Potvrda ${ponistenaPotvrda} je prestala da proizvodi dejstvo. Da li je bila lažna ceni se po čl. 6 st. 6 Pravilnika o učešću dece.`,
      );
    }
  }

  // Licu na koje se prijava odnosi — bez podnosioca (st. 3).
  await obavesti(prijava.roditeljId, {
    tip: "roditeljstvo_prijava_odluka",
    kljuc: ishod === "UKINUTA" ? "notifikacije.roditeljstvo_prijava_ukinuta" : "notifikacije.roditeljstvo_prijava_nema_osnova",
    parametri: { pseudonim: prijava.dete.pseudonim },
    naslov: ishod === "UKINUTA" ? "Veza sa nalogom deteta je ukinuta" : "Veza sa nalogom deteta ponovo radi",
    tekst:
      ishod === "UKINUTA"
        ? `Fondacija je utvrdila da nisi roditelj deteta ${prijava.dete.pseudonim} i ukinula je vezu. Na odluku možeš uložiti prigovor.`
        : `Fondacija je odlučila da prijava nema osnova. Veza sa nalogom deteta ${prijava.dete.pseudonim} ponovo radi.`,
    link: "/profil",
  }).catch(() => {});

  for (const podnosilacId of podnosioci) {
    await obavesti(podnosilacId, {
      tip: "roditeljstvo_prijava_odluka",
      kljuc: "notifikacije.roditeljstvo_prijava_odluka_podnosilac",
      parametri: {},
      naslov: "Fondacija je odlučila o tvojoj prijavi",
      tekst:
        ishod === "UKINUTA"
          ? "Fondacija je utvrdila da prijavljeno lice nije roditelj i ukinula je vezu."
          : "Fondacija je odlučila da prijava nema osnova; veza ponovo radi. Na odluku možeš uložiti prigovor.",
      link: "/pocetna",
    }).catch(() => {});
  }

  if (deteBezRoditelja) {
    await obavesti(prijava.deteId, {
      tip: "dete_bez_roditelja",
      kljuc: "notifikacije.dete_bez_roditelja",
      naslov: "Nalog opet čeka roditelja",
      tekst: "Tvoj nalog opet čeka da ga preuzme mama ili tata. Nov kod je na tvom profilu.",
      link: "/pocetna",
    }).catch(() => {});
  }

  return { ok: true, deteBezRoditelja };
}

// ── Prikaz roditelju ──────────────────────────────────────────────────────────

/** Spisak dece sa stanjem naloga i onim na šta se čeka — za odeljak „Moja deca". */
export async function dohvatiDecu(roditeljId: string) {
  const deca = await prisma.user.findMany({
    where: {
      maloletan: true,
      deaktiviranAt: null,
      // Zaustavljena veza ne daje uvid (čl. 4e st. 2), ali dete ostaje na spisku
      // sa oznakom, da roditelj zna šta se desilo.
      roditeljstvaKaoDete: { some: { roditeljId } },
    },
    orderBy: { createdAt: "asc" },
    select: {
      ...IZBOR_UCESNIKA,
      pseudonim: true,
      avatar: true,
      wallet: { select: { balance: true } },
      roditeljPoziv: { select: { kod: true } },
      roditeljstvaKaoDete: {
        ...IZBOR_UCESNIKA.roditeljstvaKaoDete,
        select: {
          ...IZBOR_UCESNIKA.roditeljstvaKaoDete.select,
          id: true,
          roditelj: {
            select: { ...IZBOR_UCESNIKA.roditeljstvaKaoDete.select.roditelj.select, pseudonim: true },
          },
          potvrdePostojanja: {
            where: { aktivnaKljuc: { not: null } },
            select: { id: true, potvrdjenoAt: true },
            take: 1,
          },
        },
      },
    },
  });
  const danas = beogradskiDan();
  return deca.map((d) => {
    const moja = d.roditeljstvaKaoDete.find((r) => r.roditeljId === roditeljId);
    const zaustavljeno = Boolean(moja?.zaustavljenaAt);
    const mojZahtev = moja?.potvrdePostojanja[0] ?? null;
    const red = {
      ...d,
      roditeljstvaKaoDete: d.roditeljstvaKaoDete.map((r) => ({
        ...r,
        potvrdePostojanja: r.potvrdePostojanja.filter((p) => p.potvrdjenoAt !== null),
      })),
    };
    return {
      id: d.id,
      pseudonim: d.pseudonim,
      avatar: d.avatar,
      godine: d.datumRodjenja ? uzrast(d.datumRodjenja, danas) : null,
      dozvolaOdrasli: d.dozvolaOdrasli,
      // Dok je veza zaustavljena, roditelj nema uvid — ni u stanje zapisa.
      balans: zaustavljeno ? null : (d.wallet?.balance ?? 0),
      stanje: ucesnikIzReda(red).stanje,
      naStaSeCeka: naStaSeCeka(roditeljiIzReda(red)),
      zaustavljeno,
      // Potvrda postojanja ZA OVOG roditelja (čl. 6): nema / tražena / potvrđena.
      postojanje: mojZahtev ? (mojZahtev.potvrdjenoAt ? "POTVRDJENO" : "TRAZENO") : "NIJE_TRAZENO",
      // Šestocifreni kod stoji uz dete i posle preuzimanja — njime DRUGI roditelj
      // ulazi u nalog (čl. 4b st. 6).
      kod: zaustavljeno ? null : (d.roditeljPoziv?.kod ?? null),
      roditelji: d.roditeljstvaKaoDete.map((r) => r.roditelj.pseudonim),
    };
  });
}

/** Na šta čeka nalog deteta (čl. 4c poslednji stav) — za profil deteta. */
export async function naStaCekaNalog(deteId: string): Promise<NaStaSeCeka | null> {
  const red = await prisma.user.findUnique({ where: { id: deteId }, select: IZBOR_UCESNIKA });
  if (!red?.maloletan) return null;
  return naStaSeCeka(roditeljiIzReda(red));
}

/**
 * Odluka o pristupu profilu maloletnog korisnika (vidi `smeDaVidiProfilDeteta`).
 *
 * Kad pristup nije dopušten, vraća se sadržaj ZATVORENOG PRIKAZA — a ne gola
 * zabrana. Ekran mora da uradi tri stvari, inače izgleda kao kvar:
 *   1. kaže ZAŠTO profil nije otvoren,
 *   2. imenuje ODRASLU OSOBU kojoj se čovek obraća (čl. 10 — roditelj odgovara za
 *      radnje deteta; bez imena roditelja je to slepa ulica, a i zapis u knjizi
 *      ostaje neobjašnjen: „ko je sad pa Mihajlo"),
 *   3. pokazuje JEDINI dozvoljeni put dalje — oglas na Pijaci.
 *
 * 🔴 U zatvorenom prikazu NE SME biti ničega drugog: ni stanja, ni škole, ni
 * oglasa, ni prijateljstava. Svaki dodatak pretvara ekran u mali profil.
 *
 * `razlog` razdvaja dva različita ekrana: punoletnom članu se objašnjava pravilo,
 * detetu se kaže da profil vidi samo svojim prijateljima.
 */
export async function pristupProfiluDeteta(
  posmatracId: string | null,
  metaId: string,
  posmatracJeAdmin: boolean
): Promise<
  | {
      sme: true;
      /** Na šta nalog deteta čeka (čl. 4c poslednji stav); `null` za dete Kola i odrasle. */
      naStaSeCeka?: NaStaSeCeka | null;
    }
  | {
      sme: false;
      zatvoren: {
        pseudonim: string;
        roditelji: { id: string; pseudonim: string }[];
        razlog: "PUNOLETAN" | "NIJE_PRIJATELJ";
      };
    }
> {
  const metaRed = await prisma.user.findUnique({ where: { id: metaId }, select: IZBOR_UCESNIKA });
  const meta = metaRed ? ucesnikIzReda(metaRed) : null;
  if (!meta || !meta.maloletan) return { sme: true, naStaSeCeka: null };
  const cekanje = naStaSeCeka(roditeljiIzReda(metaRed!));

  const posmatrac = posmatracId ? await ucitajUcesnika(posmatracId) : null;

  // Prijateljstvo se proverava upitom umesto pozivom `suPrijatelji()` iz
  // `prijateljstva.ts` — taj modul uvozi OVAJ (`IZBOR_UCESNIKA`, `ucesnikIzReda`),
  // pa bi obrnut uvoz zatvorio krug. Par se uvek pamti uređeno (`aId < bId`).
  const [aId, bId] = posmatracId
    ? posmatracId < metaId
      ? [posmatracId, metaId]
      : [metaId, posmatracId]
    : ["", ""];
  const prijatelji =
    posmatracId && posmatrac?.maloletan
      ? (await prisma.prijateljstvo.count({ where: { aId, bId, raskinutAt: null } })) > 0
      : false;

  if (
    smeDaVidiProfilDeteta(
      posmatrac ? { ...posmatrac, admin: posmatracJeAdmin } : null,
      meta,
      prijatelji
    )
  ) {
    return { sme: true, naStaSeCeka: cekanje };
  }

  const red = await prisma.user.findUnique({
    where: { id: metaId },
    select: {
      pseudonim: true,
      roditeljstvaKaoDete: {
        where: { zaustavljenaAt: null },
        select: { roditelj: { select: { id: true, pseudonim: true } } },
      },
    },
  });

  return {
    sme: false,
    zatvoren: {
      pseudonim: red?.pseudonim ?? "",
      roditelji: red?.roditeljstvaKaoDete.map((r) => r.roditelj) ?? [],
      razlog: posmatrac?.maloletan ? "NIJE_PRIJATELJ" : "PUNOLETAN",
    },
  };
}

/**
 * Prisma uslov nad `Wallet`-om: zapis koji NE pripada maloletnom korisniku.
 *
 * Dečji prostor nije javan (Pravilnik o učešću dece čl. 13), pa se transakcija u
 * kojoj je bilo koja strana maloletna ne prikazuje ni verifikovanom posmatraču —
 * feed bi mu inače otkrio pseudonim deteta.
 *
 * 🔴 Zapis Protokola i zapis Kruga nemaju korisnika; uslov ih mora PROPUSTITI,
 * inače bi svaka emisija ispala iz spiska.
 *
 * 🔴 Živi na jednom mestu namerno (R-03). Do tog seta je uslov postojao samo u
 * `/api/javno/feed`, dok je stranica `/sistem` dizala iste transakcije sopstvenim
 * upitom bez njega — pa je pseudonim deteta izlazio na ekran koji istu proveru
 * dva fajla dalje izričito sprovodi. Svaki nov spisak transakcija uzima OVAJ
 * uslov, ne svoju kopiju.
 */
export const BEZ_DECE: Prisma.WalletWhereInput = {
  OR: [{ user: { is: null } }, { user: { is: { maloletan: false } } }],
};

// ── Obaveštenje roditelju o oglasu deteta (čl. 10 st. 6) ─────────────────────

/**
 * Javlja svakom roditelju da je dete objavilo oglas.
 *
 * 🔴 Uvedeno uz R-07 (nelojalna i obmanjujuća poslovna praksa), mera M-5″ t. 4.
 * Nalaz koji ga je tražio: oglas koji postavi dete vidi SAMO druga deca (do 15.
 * godine u celini, iznad toga i punoletni uz roditeljsku saglasnost —
 * `usloviVidljivostiOglasa`). Dakle publika je pretežno ili isključivo maloletna,
 * a jedini odrastao koji taj oglas uopšte vidi jeste roditelj.
 *
 * 🔴 Čl. 10 st. 6 Pravilnika o učešću dece čini roditelja odgovornim za sadržaj
 * koji je dete objavilo **do trenutka uklanjanja** i za radnje deteta na Platformi.
 * Ta odredba je neizvodljiva dok roditelj ne zna da je oglas objavljen — do ovog
 * seta ga je video samo ako bi sam otvorio profil deteta. Obaveštenje pretvara
 * pasivan uvid u aktivan; dugme „Ukloni" stoji tamo gde link vodi (čl. 10 st. 1).
 *
 * 🟡 Pokriva ono što je OBJAVLJENO. Razmena dogovorena mimo oglasa Platformi nije
 * vidljiva i ne pokušava da bude — praćenje obrazaca prepisa je odbijeno uz stari
 * R-19 („nemoguće je sprovesti kontrolu kada je transfer poena slobodan"). Zabranu
 * iz čl. 21 Uslova zato nosi RADNJA, ne oglas, pa osnov za meru postoji i kada
 * oglasa nema.
 *
 * Ne baca: objava oglasa ne sme da padne zato što obaveštenje nije otišlo.
 */
export async function javiRoditeljimaZaOglas(
  deteId: string,
  oglas: { id: string; title: string },
): Promise<void> {
  try {
    const dete = await prisma.user.findUnique({
      where: { id: deteId },
      select: {
        pseudonim: true,
        maloletan: true,
        roditeljstvaKaoDete: { select: { roditeljId: true } },
      },
    });
    if (!dete?.maloletan) return;

    for (const { roditeljId } of dete.roditeljstvaKaoDete) {
      await obavesti(roditeljId, {
        tip: "dete_oglas",
        kljuc: "notifikacije.dete_oglas",
        parametri: { pseudonim: dete.pseudonim, naslov: oglas.title },
        naslov: `${dete.pseudonim} je objavio/la oglas`,
        tekst: `Oglas „${oglas.title}". Na profilu deteta možeš da ga pogledaš i ukloniš.`,
        link: `/deca/${deteId}`,
      }).catch(() => {});
    }
  } catch (e) {
    console.error("[deca] Obaveštenje roditelju o oglasu nije poslato", deteId, e);
  }
}

/**
 * Šta čeka roditelja (paket F, 24.10.2026): prepisi dece iznad praga koji čekaju
 * njegovo odobrenje (čl. 14) i pozivi u kojima je dete navelo njegovu adresu
 * (čl. 4b). Čita ga „Čeka na tebe" na Početnoj.
 *
 * Zaustavljena veza (čl. 4e st. 2) ne daje ovlašćenja roditelja, pa se prepisi
 * takvog deteta ne broje.
 * Uslov poziva je isti kao u `poziviZaEmail` (`deca-poziv.ts`).
 */
export async function cekaRoditelja(roditeljId: string, email: string | null) {
  const sada = new Date();
  const [prepisi, pozivi] = await Promise.all([
    prisma.prepisOdobrenje.findMany({
      where: {
        status: "CEKA",
        rokDo: { gt: sada },
        dete: {
          deaktiviranAt: null,
          roditeljstvaKaoDete: { some: { roditeljId, zaustavljenaAt: null } },
        },
      },
      select: { deteId: true },
    }),
    email
      ? prisma.roditeljPoziv.count({
          where: {
            email: email.trim().toLowerCase(),
            iskoriscenAt: null,
            odbijenAt: null,
            brisanjeDo: { gt: sada },
            dete: { deaktiviranAt: null, maloletan: true },
          },
        })
      : Promise.resolve(0),
  ]);
  const deca = [...new Set(prepisi.map((p) => p.deteId))];
  return {
    prepisi: prepisi.length,
    // Jedno dete → pravo na njegova podešavanja, gde je odobrenje; više → „Moja deca".
    prepisiHref: deca.length === 1 ? `/deca/${deca[0]}` : "/profil#moja-deca",
    pozivi,
  };
}
