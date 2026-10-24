/**
 * Cirkularna SISTEMSKA obaveštenja — jedna poruka svim korisnicima.
 *
 * Namena je uska i propisana aktima: izmene Uslova i Politike privatnosti
 * (Uslovi čl. 40, Politika čl. 16 — izmene stupaju na snagu danom donošenja, a
 * obaveštenje se šalje bez odlaganja; rok od 15 dana je ukinut setom 4.3.0),
 * planirani zastoj
 * duži od 24 sata (Uslovi čl. 33) i slična obaveštenja koja Fondacija DUGUJE
 * korisnicima. Zato ova pošta NE poštuje `User.emailObavestenja` opt-out.
 *
 * ⚠️ Ovo NIJE kanal za vesti ni bilten. Politika privatnosti čl. 8 deklariše
 * Resend „isključivo za dostavljanje sistemskih obaveštenja"; slanje biltena je
 * druga svrha obrade i traži dopunu Politike/DPIA/Radnji obrade, novu verziju
 * Politike sa ponovnom saglasnošću i zaseban pristanak korisnika.
 *
 * Slanje je NASTAVLJIVO. Vercel funkcija ima ograničeno vreme, a plan ne dozvoljava
 * subdnevni cron (vidi CLAUDE.md), pa se ne oslanjamo na pozadinski proces:
 * jedan poziv obradi koliko stigne u zadatom budžetu vremena i zapamti kursor;
 * sledeći poziv nastavlja odatle. Kursor je poslednji obrađeni `User.id` u
 * stabilnom rastućem redosledu po id-u — korisnik ne može da dobije istu poruku
 * dvaput, a nalozi napravljeni usred slanja jednostavno upadnu ili ne upadnu u
 * zahvat, u zavisnosti od id-a (bez duplikata u oba slučaja).
 */
import { prisma } from "./prisma";
import {
  BATCH_MAX,
  bazniUrl,
  emailLayout,
  esc,
  posaljiEmailBatch,
  type BatchStavka,
} from "./email";

/** Vreme koje jedan poziv sme da provede u slanju, pre nego što vrati napredak. */
const BUDZET_MS = 45_000;

/**
 * Pauza između porcija. Resend dozvoljava ~10 zahteva/s po timu (stariji nalozi
 * 2/s), pa 250ms drži ~4 zahteva/s — sa marginom i za starije limite.
 */
const PAUZA_MS = 250;

/** Koliko puta se porcija ponavlja pre nego što se odbroji kao neuspela. */
const POKUSAJA = 2;

/**
 * Ko prima sistemska obaveštenja: svi nalozi sa email adresom koji nisu ugašeni.
 *
 * Suspendovani su namerno UNUTRA — obaveštenje o suspenziji i o izmeni Uslova
 * duguje im se isto kao i ostalima (Uslovi čl. 27, 40).
 */
export function primaociUslov() {
  return { deaktiviranAt: null, email: { not: null } } as const;
}

export async function prebrojPrimaoce(): Promise<number> {
  return prisma.user.count({ where: primaociUslov() });
}

/** HTML jedne poruke — bez linka za odjavu, uz obrazloženje zašto stiže. */
export function teloObavestenja(
  o: { naslov: string; tekst: string; link?: string | null; pravniOsnov: string },
  pseudonim: string,
): string {
  const baza = bazniUrl();
  return emailLayout({
    naslov: o.naslov,
    pozdrav: pseudonim,
    telo: [esc(o.tekst)],
    dugme: o.link ? { tekst: "Otvori u aplikaciji", link: `${baza}${o.link}` } : undefined,
    // Namerno bez linka za odjavu: ovo je obaveštenje koje Fondacija duguje po
    // aktima, pa bi dugme za odjavu obećavalo nešto što ne može da ispuni.
    podnozje:
      `Ovo obaveštenje šaljemo svim korisnicima na osnovu: ${esc(o.pravniOsnov)}. ` +
      `Ne može se isključiti u podešavanjima jer ne spada u obaveštenja po izboru.`,
  });
}

export interface Napredak {
  status: "U_SLANJU" | "POSLATO" | "PREKINUTO" | "NACRT";
  ukupno: number;
  poslato: number;
  neuspesno: number;
  zavrseno: boolean;
}

/**
 * Pošalji sledeću grupu porcija za dato obaveštenje i vrati napredak.
 * Poziva se više puta dok `zavrseno` ne postane `true`.
 */
export async function posaljiSledecuPorciju(
  obavestenjeId: string,
  budzetMs = BUDZET_MS,
): Promise<Napredak> {
  const pocetak = Date.now();

  const o = await prisma.sistemskoObavestenje.findUnique({ where: { id: obavestenjeId } });
  if (!o) throw new Error("Obaveštenje ne postoji.");
  if (o.status === "POSLATO") {
    return { status: "POSLATO", ukupno: o.ukupno, poslato: o.poslato, neuspesno: o.neuspesno, zavrseno: true };
  }
  if (o.status === "PREKINUTO") {
    return { status: "PREKINUTO", ukupno: o.ukupno, poslato: o.poslato, neuspesno: o.neuspesno, zavrseno: true };
  }

  // Prvo pokretanje: zabeleži ukupan broj primalaca i vreme početka.
  if (o.status === "NACRT") {
    const ukupno = await prebrojPrimaoce();
    await prisma.sistemskoObavestenje.update({
      where: { id: obavestenjeId },
      data: { status: "U_SLANJU", ukupno, pokrenutoAt: new Date() },
    });
    o.status = "U_SLANJU";
    o.ukupno = ukupno;
  }

  let kursor = o.kursorId;
  let poslato = o.poslato;
  let neuspesno = o.neuspesno;

  while (Date.now() - pocetak < budzetMs) {
    const primaoci = await prisma.user.findMany({
      where: { ...primaociUslov(), ...(kursor ? { id: { gt: kursor } } : {}) },
      select: { id: true, email: true, pseudonim: true },
      orderBy: { id: "asc" },
      take: BATCH_MAX,
    });

    if (primaoci.length === 0) {
      await prisma.sistemskoObavestenje.update({
        where: { id: obavestenjeId },
        data: { status: "POSLATO", poslato, neuspesno, kursorId: kursor, zavrsenoAt: new Date() },
      });
      return { status: "POSLATO", ukupno: o.ukupno, poslato, neuspesno, zavrseno: true };
    }

    const stavke: BatchStavka[] = primaoci.map((p) => ({
      to: p.email!,
      subject: `${o.naslov} — KOLO`,
      html: teloObavestenja(o, p.pseudonim),
    }));

    let uspeh = false;
    for (let pokusaj = 1; pokusaj <= POKUSAJA && !uspeh; pokusaj++) {
      uspeh = await posaljiEmailBatch(stavke, "sistemsko");
      if (!uspeh && pokusaj < POKUSAJA) await pauza(PAUZA_MS * 4);
    }

    // Porcija koja ne prođe ni iz drugog pokušaja se odbroji kao neuspela i
    // slanje ide dalje — jedna loša adresa ne sme da zaustavi ceo krug.
    if (uspeh) poslato += primaoci.length;
    else neuspesno += primaoci.length;

    kursor = primaoci[primaoci.length - 1].id;

    await prisma.sistemskoObavestenje.update({
      where: { id: obavestenjeId },
      data: { poslato, neuspesno, kursorId: kursor },
    });

    await pauza(PAUZA_MS);
  }

  return { status: "U_SLANJU", ukupno: o.ukupno, poslato, neuspesno, zavrseno: false };
}

function pauza(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
