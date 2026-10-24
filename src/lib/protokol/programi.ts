import { prisma } from "@/lib/prisma";
import { emitujPoen } from "./emisija";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";
import { danObracuna } from "./obracunski-dan";
import { FUNKCIONALNI_PRAG_INDEKSA } from "./dokaz-stvarnosti";
import { OsnovPodrske, ProgramType, TipKorisnika, TransactionType } from "@/generated/prisma/client";

const PROTOKOL_WALLET_ID = "banka-singleton";

// ── Reverifikacija / obustava socijalnih programa (Pravilnik o programima podrške) ──

/**
 * Osnovni broj dana do reverifikacije po TIPU programa (null = nema periodične
 * revizije).
 *
 * 🔴 Nije konačan rok i rute je ne zovu — zovu `rokReverifikacije`, koja kod
 * Posebne podrške uzima u obzir i osnov (gubitak doma teče od događaja, akutna
 * bolest traje šest meseci) i gornja ograničenja iz čl. 12. Ovde stoji podrazumevana
 * vrednost i jedno mesto sa koga je `rokReverifikacije` čita, da ne nastanu dve
 * istine o istom roku.
 */
export function danaDoReverifikacije(type: ProgramType): number | null {
  if (type === "POSEBNA_BRIGA") return 365; // godišnja revizija (čl. 12)
  if (type === "SKOLOVANJE") return 183; // po studijskoj godini (čl. 13)
  return null; // MAJKAMA/STARIJIMA — stabilne činjenice, bez periodične revizije
}

/**
 * Konkretan rok reverifikacije jedne prijave (Pravilnik o programima podrške
 * čl. 12, 13). Čista funkcija — vraća datum ili `null` kad roka nema.
 *
 * 🔴 Ovo, a ne `danaDoReverifikacije`, zovu rute: kod Posebne podrške rok zavisi
 * od OSNOVA, a osnov se ne vidi iz tipa programa. Čl. 12 razlikuje tri roka:
 *  - smanjena sposobnost po rešenju → godišnja revizija;
 *  - smanjena sposobnost zbog akutne bolesti → šest meseci, pa ponovna prijava;
 *  - gubitak doma → dvanaest meseci **od događaja**, bez revizije.
 *
 * 🔴 Dva gornja ograničenja, oba iz čl. 12: pravo za maloletno lice prestaje
 * punoletstvom tog lica, a pravo po rešenju ne može nadživeti sam akt, pa datum
 * isteka rešenja — koji se po istom članu i beleži — obara rok kad je bliži.
 * Beleži se samo datum, nikad sadržaj rešenja.
 *
 * Zatečena prijava bez osnova drži stari rok od 365 dana: promena pravila ne sme
 * da skrati pravo koje je odobreno pre nje.
 */
export function rokReverifikacije(
  prijava: { type: ProgramType; osnov: OsnovPodrske | null; metadata: unknown },
  odKada: Date,
): Date | null {
  const dan = 24 * 60 * 60 * 1000;
  const pomeri = (osnovica: Date, dana: number) => new Date(osnovica.getTime() + dana * dan);

  if (prijava.type !== "POSEBNA_BRIGA") {
    const dana = danaDoReverifikacije(prijava.type);
    return dana == null ? null : pomeri(odKada, dana);
  }

  const meta = (prijava.metadata ?? {}) as Record<string, unknown>;
  const datum = (kljuc: string): Date | null => {
    const v = meta[kljuc];
    if (typeof v !== "string" || v.trim() === "") return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  if (prijava.osnov === "GUBITAK_DOMA") {
    // „Traje dvanaest meseci **od događaja**" — ne od odobravanja. Bez datuma
    // događaja rok teče od odobravanja, da pravo ne ostane bez roka.
    return pomeri(datum("datumDogadjaja") ?? odKada, 365);
  }

  const akutna = meta.dokaz === "BOLEST_AKUTNA";
  let rok = pomeri(odKada, akutna ? 183 : 365);
  for (const gornja of [datum("punoletstvoAt"), akutna ? null : datum("datumIsteka")]) {
    if (gornja && gornja.getTime() < rok.getTime()) rok = gornja;
  }
  return rok;
}

export type RevizijaRazlog = "revizija" | "indeks";

/**
 * Da li ACTIVE socijalni program treba obustaviti (čista, testabilna odluka):
 *  - "revizija": prošao rok `nextReverifikacija`, status nije ponovo potvrđen (čl. 12);
 *  - "indeks": učesnik više nije VERIFIKOVAN (pala mu je verifikacija) — osnov na
 *    kojem je program odobren više ne važi. Ime razloga je interno i ostaje.
 *
 * Uslov je verifikovanost (programi čl. 4 st. 1; set 4.8.2 — i član bez potvrde).
 * 🔴 Imunitet `NOSILAC_ZRNA` je ukinut setom 4.8.2: čuvar Kola kome padne
 * verifikacija postaje korisnik (Pravilnik čl. 30 st. 3), pa i njemu program
 * staje. Jedini izuzetak je osnivač, koji je uvek potvrđen (dokaz čl. 14, 15).
 * Vraća null ako program ostaje aktivan.
 */
export function razlogObustaveProgram(
  args: {
    nextReverifikacija: Date | null;
    indeksStvarnosti: number;
    /** Kad nije dat, verifikovanost se čita samo iz indeksa. */
    verified?: boolean;
    jeOsnivac?: boolean;
    /** Ne utiče na odluku (imunitet ukinut); ostaje radi zatečenih poziva. */
    tipKorisnika?: TipKorisnika | string;
  },
  sada: Date
): RevizijaRazlog | null {
  if (args.nextReverifikacija != null && args.nextReverifikacija.getTime() <= sada.getTime()) {
    return "revizija";
  }
  if (args.jeOsnivac) return null;
  if (args.verified === false || args.indeksStvarnosti < FUNKCIONALNI_PRAG_INDEKSA) {
    return "indeks";
  }
  return null;
}

// ── Koeficijenti po rednom broju deteta (Pravilnik o programima podrške) ──────
// Progresivna skala: 1.→1,0 2.→1,2 3.→1,5 4.→2,0 5.→3,0 6.→4,5 7.→6,0 8.→8,0 9.→10,0
// Za 10. dete i dalje progresija se nastavlja korakom +2,0 (10.→12,0 11.→14,0 …).

const KOEF_DECE = [1.0, 1.2, 1.5, 2.0, 3.0, 4.5, 6.0, 8.0, 10.0];

function koeficijentDeteta(index: number): number {
  if (index < KOEF_DECE.length) return KOEF_DECE[index];
  return KOEF_DECE[KOEF_DECE.length - 1] + 2.0 * (index - KOEF_DECE.length + 1);
}

function godinaRazlike(rodjendan: Date, danas: Date): number {
  let god = danas.getFullYear() - rodjendan.getFullYear();
  const m = danas.getMonth() - rodjendan.getMonth();
  if (m < 0 || (m === 0 && danas.getDate() < rodjendan.getDate())) god--;
  return god;
}

// ── Iznosi po programu ────────────────────────────────────────────────────────

type MajkeMetadata = { deca: { datumRodjenja: string }[] };
type StarijiMetadata = { datumRodjenja: string };

export function izracunajMajke(metadata: unknown, danas: Date): number {
  const m = metadata as MajkeMetadata;
  if (!m?.deca?.length) return 0;
  const BAZA = 2000;
  let total = 0;
  for (let i = 0; i < m.deca.length; i++) {
    const god = godinaRazlike(new Date(m.deca[i].datumRodjenja), danas);
    if (god >= 20 || god < 0) continue; // van trajanja
    const bazaSmanjenje = Math.max(0, BAZA - god * 100);
    total += Math.floor(bazaSmanjenje * koeficijentDeteta(i));
  }
  return total;
}

export function izracunajStariji(metadata: unknown, danas: Date): number {
  const m = metadata as StarijiMetadata;
  if (!m?.datumRodjenja) return 0;
  const god = godinaRazlike(new Date(m.datumRodjenja), danas);
  if (god < 50) return 0;
  return 1000 + 100 * (god - 50);
}

export function izracunajDnevniIznos(
  type: ProgramType,
  metadata: unknown,
  _dailyAmount: number | null,
  danas: Date
): number {
  switch (type) {
    case "PODRSKA_MAJKAMA":   return izracunajMajke(metadata, danas);
    case "PODRSKA_STARIJIMA": return izracunajStariji(metadata, danas);
    case "POSEBNA_BRIGA":     return 2000;
    case "SKOLOVANJE":        return 2000;
    case "PED":               return 0; // operativni doprinos ne ide kroz enrollment — raspodela iz OglasEvidencija (čl. 24)
  }
}

// ── Raspodela operativnog doprinosa (Pravilnik o operativnom doprinosu čl. 24) ──
//
// evidentirani POEN = predloženi POEN × min(1, L/P)
//   P = zbir predloženih POEN-a svih potvrđenih verifikacija u periodu
//   L = dnevni limit (10% opticaja, deljen sa socijalnim programima — Pravilnik čl. 15)
//
// Napomena o zajedničkom poolu: master Pravilnik (čl. 15) stavlja operativni doprinos
// i socijalne programe u JEDAN dnevni limit od 10%. Zato se predloženi POEN potvrđenih
// verifikacija ubacuje u isti pool kao socijalni programi, a `raspodelaKoeficijent`
// nad ukupnom potražnjom prirodno daje min(1, L/P) iz čl. 24.

/** Koeficijent srazmerne raspodele: min(1, limit/totalRequested). */
export function raspodelaKoeficijent(totalRequested: number, limit: number): number {
  return totalRequested > limit && limit > 0 ? limit / totalRequested : 1.0;
}

/** Evidentirani (stvarni) POEN za jednu potvrđenu verifikaciju. Math.floor — u korist Protokola. */
export function evidentiraniPoen(predlozeniPoen: number, koeficijent: number): number {
  return Math.floor(predlozeniPoen * koeficijent);
}

// ── Nocna emisija ─────────────────────────────────────────────────────────────

type EmisijaItem = {
  walletId: string;
  /** Vlasnik zapisa — treba za otključavanje POEN-a po potvrdi kod operativnog (čl. 7). */
  userId: string;
  amount: number;
  type: ProgramType;
  evidencijaId?: string;
  /** Prijava na socijalni program — nosi lični zbir (R-03, M-1). Nema je kod PED-a. */
  enrollmentId?: string;
};

export async function izvrsiNocnuEmisiju(datum: Date) {
  // Obračunski dan po srpskom vremenu (cron 22:00 UTC = ponoć po lokalnom leti)
  const danas = danObracuna(datum);

  // 1. Opticaj i limit
  const protokol = await prisma.wallet.findUnique({ where: { id: PROTOKOL_WALLET_ID } });
  const opticaj = Math.abs(protokol?.balance ?? 0);
  const limit = Math.floor(opticaj * 0.1);

  // K4: BRAVA DANA — `create` summary-ja za `danas` služi kao zaključavanje. Ako je
  // noćna emisija već pokrenuta (cron retry ili cron + ručni admin okidač), drugi poziv
  // dobije P2002 na jedinstvenom `date` i ceo posao se preskače — bez dvostruke emisije.
  try {
    await prisma.dailyEmissionSummary.create({
      data: { date: danas, opticaj, limit, totalRequested: 0, totalEmitted: 0, koeficijent: 1, breakdown: {} },
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return { opticaj, limit, totalRequested: 0, totalEmitted: 0, koeficijent: 1, breakdown: {}, preskoceno: true };
    }
    throw e;
  }

  // 2. Aktivni programi
  const aktivniProgrami = await prisma.protokolProgram.findMany({ where: { isActive: true } });
  const aktivniTipovi = new Set(aktivniProgrami.map((p) => p.type));

  // 3. Automatski programi — aktivni enrollment-i
  const enrollments = await prisma.programEnrollment.findMany({
    where: { status: "ACTIVE" },
    include: { user: { include: { wallet: true } } },
  });

  const items: EmisijaItem[] = [];

  for (const en of enrollments) {
    if (!aktivniTipovi.has(en.type)) continue;
    if (!en.user.wallet) continue;

    const amount = izracunajDnevniIznos(en.type, en.metadata, en.dailyAmount, danas);
    if (amount > 0) {
      items.push({ walletId: en.user.wallet.id, userId: en.user.id, amount, type: en.type, enrollmentId: en.id });
    }
  }

  // 4. Operativni doprinos — sve potvrđene verifikacije (status APPROVED) ulaze u
  //    raspodelu ovog perioda (čl. 22, 24). Težina je `predlozeniPoen`; stvarni
  //    evidentirani iznos računa se srazmerno dnevnom limitu (čl. 24).
  if (aktivniTipovi.has("PED")) {
    const evidencije = await prisma.oglasEvidencija.findMany({
      where: { status: "APPROVED" },
      include: { user: { include: { wallet: true } } },
    });
    for (const ev of evidencije) {
      if (!ev.user.wallet) continue;
      items.push({
        walletId: ev.user.wallet.id,
        userId: ev.user.id,
        amount: ev.predlozeniPoen,
        type: "PED",
        evidencijaId: ev.id,
      });
    }
  }

  if (items.length === 0) {
    // Summary za danas je već kreiran (brava dana) — samo ga ostavi praznim.
    return { opticaj, limit, totalRequested: 0, totalEmitted: 0, koeficijent: 1, breakdown: {} };
  }

  // 5. Proporcionalno smanjenje (Pravilnik čl. 50; operativni čl. 24: min(1, L/P))
  const totalRequested = items.reduce((s, i) => s + i.amount, 0);
  const koeficijent = raspodelaKoeficijent(totalRequested, limit);

  // 6. Emisije
  const breakdown: Record<string, { count: number; requested: number; emitted: number }> = {};
  let totalEmitted = 0;

  for (const item of items) {
    const emitAmount = evidentiraniPoen(item.amount, koeficijent);

    if (emitAmount > 0) {
      // 🔴 Opis socijalnog programa NE imenuje program, i to OSTAJE i posle seta
      // 4.6.7, koji je naziv programa otvorio verifikovanim članovima. Razlika je
      // u tome ODAKLE naziv dolazi: iz prijave na program, ne iz opisa zapisa.
      // Opis je trajan i ide u GDPR izvoz, pa upisan naziv više nikad ne bi mogao
      // da se suzi ako se odluka o prikazu promeni; prijava se povlačenjem
      // pristanka briše, i prikaz s njom nestaje. Isto pravilo kao kod snimljenog
      // teksta ugovora: ono što je trajno mora da nosi najmanje što je dovoljno.
      // Razlaganje po OSNOVU (smanjena sposobnost / gubitak doma) ne izlazi ni
      // verifikovanom članu — vidi ga sam korisnik i lice koje obrađuje prijavu.
      //
      // 🔴 Ovo obara odluku od 07.09.2026. („mora biti osnov programa i tip") —
      // tada se nije znalo da iznos sam invertuje godište i broj dece, pa je
      // opšta oznaka druga brana uz izlazak reda iz javnog prikaza.
      //
      // Operativni doprinos zadržava i sopstveni tip i imenovan opis: nije
      // posebna kategorija i po odluci vlasnika se ne dira.
      const jeOperativni = item.type === "PED";
      await emitujPoen(
        item.walletId,
        emitAmount,
        jeOperativni ? TransactionType.EMISIJA_OPERATIVNI : TransactionType.EMISIJA_PROGRAM,
        jeOperativni ? `Program ${labelPrograma(item.type)}` : OPIS_SOCIJALNOG_PROGRAMA,
        jeOperativni
          ? { kljuc: "transakcije.program", parametri: { program: labelPrograma(item.type) } }
          : { kljuc: "transakcije.socijalni_program" },
        // 🔴 Veza do prijave, ne naziv programa u opisu. Iz nje se naziv izvodi pri
        // čitanju, za verifikovanog posmatrača (čl. 4 st. 4) — a prestankom prijave
        // prikaz nestaje s njom. Operativni doprinos nema prijavu na program:
        // prijavljuje se na konkretan zadatak, pa mu je veza `undefined`.
        jeOperativni ? undefined : { enrollmentId: item.enrollmentId }
      );

      // 🔴 SAMO operativni doprinos otključava POEN po potvrdi (dokaz stvarnosti
      // čl. 7). Socijalni program se namerno NE računa: to nije doprinos nego
      // podrška — korisnik prima, ne daje. Ne dodavati ga ovde.
      //
      // Ne baca: emisija je već upisana i ne sme da padne zbog ovog kanala.
      if (jeOperativni) {
        try {
          await probajEvidentiratiPotvrde(item.userId);
        } catch (e) {
          console.error("[programi] upis POEN-a po potvrdi nije uspeo", { userId: item.userId, e });
        }
      }
    }

    // Lični zbir po programu (R-03, M-1). Opis transakcije više ne imenuje program,
    // pa je ovo jedino mesto sa kog korisnik može da vidi razlaganje sopstvenog
    // podatka — prikazuje se na kartici programa.
    if (item.enrollmentId && emitAmount > 0) {
      await prisma.programEnrollment.update({
        where: { id: item.enrollmentId },
        data: { isplacenoPoen: { increment: emitAmount } },
      });
    }

    // Operativni doprinos: potvrđena verifikacija se uvek označava obrađenom (EMITTED),
    // i kada je emitovani iznos 0 — neevidentirani višak se NE prenosi u naredni period (čl. 24).
    if (item.evidencijaId) {
      await prisma.oglasEvidencija.update({
        where: { id: item.evidencijaId },
        data: { status: "EMITTED", amount: emitAmount },
      });
    }

    if (emitAmount <= 0) continue;

    const key = item.type;
    if (!breakdown[key]) breakdown[key] = { count: 0, requested: 0, emitted: 0 };
    breakdown[key].count++;
    breakdown[key].requested += item.amount;
    breakdown[key].emitted += emitAmount;
    totalEmitted += emitAmount;
  }

  // 7. Summary (row je već kreiran bravom dana — samo upiši konačne vrednosti)
  await prisma.dailyEmissionSummary.update({
    where: { date: danas },
    data: { opticaj, limit, totalRequested, totalEmitted, koeficijent: koeficijent.toFixed(6), breakdown },
  });

  return { opticaj, limit, totalRequested, totalEmitted, koeficijent, breakdown };
}

/** Jedan dan jednog socijalnog programa u javnom pregledu. */
export type DnevniProgram = {
  datum: string;
  program: ProgramType;
  korisnika: number;
  poen: number;
};

/** Socijalni programi — operativni doprinos NIJE među njima (čl. 36, svoj kanal). */
export const SOCIJALNI_PROGRAMI: ProgramType[] = [
  "PODRSKA_MAJKAMA",
  "PODRSKA_STARIJIMA",
  "POSEBNA_BRIGA",
  "SKOLOVANJE",
];

/**
 * Dnevni zbir po socijalnom programu — ono što u javnom prikazu stoji UMESTO
 * pojedinačnih emisija (R-03, mera M-1).
 *
 * 🔴 Ovim proverljivost ostaje potpuna: zbir agregata plus ostali kanali jednak je
 * promeni opticaja, pa se zero-sum i dalje proverava do POEN-a. Nestaje jedino
 * veza *jedan čovek ↔ jedan osnov ↔ jedan iznos* — a ona je ovde posebna
 * kategorija po ZZPL čl. 17.
 *
 * 🟡 Broj korisnika se objavljuje uz iznos namerno: bez njega bi se iz samog zbira
 * uz mali broj učesnika vraćao pojedinačan iznos, pa bi invertovanje godišta
 * preživelo agregaciju. Uz `korisnika ≥ 2` zbir više nije invertibilan.
 * Dan sa JEDNIM korisnikom u programu se zato ne objavljuje — vidi filter ispod.
 *
 * Ne traži nov model ni migraciju: `DailyEmissionSummary.breakdown` se ionako
 * upisuje svake noći u `izvrsiNocnuEmisiju`.
 */
export async function dnevniPregledPrograma(dana = 30): Promise<DnevniProgram[]> {
  const redovi = await prisma.dailyEmissionSummary.findMany({
    orderBy: { date: "desc" },
    take: dana,
    select: { date: true, breakdown: true },
  });

  const izlaz: DnevniProgram[] = [];
  for (const red of redovi) {
    const b = (red.breakdown ?? {}) as Record<string, { count?: number; emitted?: number }>;
    for (const program of SOCIJALNI_PROGRAMI) {
      const stavka = b[program];
      if (!stavka?.emitted) continue;
      const korisnika = stavka.count ?? 0;
      // 🔴 Dan sa jednim korisnikom se preskače: zbir bi tada BIO pojedinačan
      // iznos, pa bi agregat vratio upravo ono što mera sklanja.
      if (korisnika < 2) continue;
      izlaz.push({
        datum: red.date.toISOString().split("T")[0],
        program,
        korisnika,
        poen: stavka.emitted,
      });
    }
  }
  return izlaz;
}

/**
 * Opis emisije socijalnog programa u zapisu transakcije (R-03, mera M-1).
 *
 * 🔴 Ne sme da imenuje program. Ako zatreba razlaganje, ono se izvodi iz
 * `ProgramEnrollment`, ne iz opisa — opis je trajan, javan prema Fondaciji i
 * korisniku, i ide u GDPR izvoz.
 */
export const OPIS_SOCIJALNOG_PROGRAMA = "Socijalni program";

export function labelPrograma(type: ProgramType): string {
  const mapa: Record<ProgramType, string> = {
    PED:       "Operativni doprinos",
    PODRSKA_MAJKAMA:    "Podrška majkama",
    PODRSKA_STARIJIMA:  "Podrška starijima",
    POSEBNA_BRIGA:      "Posebna podrška",
    SKOLOVANJE:         "Školovanje",
  };
  return mapa[type];
}
