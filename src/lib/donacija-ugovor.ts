/**
 * Ugovor o donaciji fizičkog lica (Pravilnik o pokroviteljstvu i donacijama;
 * u setu 5.0 čl. 14). ČISTA funkcija — bez Prisme, jer tekst prikazuje i stranica u
 * pretraživaču.
 *
 * Zašto ovaj dokument postoji: donacija je ugovor o poklonu, a ceo pravni
 * položaj sistema počiva na tome da je BEZ NAKNADE — da donator ničim ne
 * pribavlja POEN. Dok se to nigde ne izjavljuje između strana, tvrdnja živi
 * samo u pravilniku koji piše Fondacija; ugovorom je izjavljuje i sam donator.
 *
 * 🔴 Tekst se SNIMA na zapis donacije (`DonationRecord.ugovorTekst`) i posle
 * toga se ne menja — isti razlog kao `donatorIme` i kalkulacija nabavke:
 * dokument mora da govori ono što je govorio u trenutku donacije, bez obzira
 * na kasnije izmene pravilnika.
 */

/** Oznaka Fondacije kao ugovorne strane — ista u svakom ugovoru koji platforma generiše. */
export const FONDACIJA = "KOLO Fondacija, matični broj 28836627, PIB 115840443";

export type UlazUgovoraODonaciji = {
  /** Ime i prezime donatora; null za anonimnu donaciju. */
  ime: string | null;
  pseudonim: string;
  iznosRSD: number;
  javno: boolean;
  /** Identifikator zapisa donacije — veza dokumenta sa evidencijom. */
  zapisId: string;
  datum: Date;
  /**
   * Ime uplatioca iz bankovnog izvoda (čl. 6 st. 2). Null za zatečene donacije i za
   * tokove u kojima izvod još nije pročitan.
   */
  uplatilac?: string | null;
};

// 🔴 Ulaz NEMA broj POEN-a, koeficijent ni nivo, i to je namerno (odluka vlasnika
// 25.10.2026; donacije čl. 14 st. 2 u setu 5.0). Kad dinari i POEN stoje u istom
// potpisanom tekstu, deljenjem se dobija „cena" POEN-a — ugovor bi tada sam bio
// dokaz da je POEN kupljen. Donator broj vidi u evidenciji, ne u ugovoru. Ne
// vraćati polja u tip: brana `donacija-ugovor-bez-poena-izvor.test.ts`.
// Ugovor ne upućuje na brojeve članova — tekst se snima i ne menja, a brojevi se
// menjaju sa setom akata.

function broj(n: number): string {
  return n.toLocaleString("sr-RS");
}

export function generisiUgovorODonaciji(p: UlazUgovoraODonaciji): string {
  const datum = p.datum.toLocaleDateString("sr-RS");
  const donator = p.javno
    ? `${p.ime ?? p.pseudonim}, korisnik KOLO platforme pod pseudonimom ${p.pseudonim}`
    : `korisnik KOLO platforme pod pseudonimom ${p.pseudonim}`;

  const clan4 = p.javno
    ? "Donacija je javna. Ime i prezime Donatora beleže se uz zapis donacije i objavljuju u listi donacija dostupnoj punoletnim korisnicima, uz iznos i datum, bez pseudonima, radi transparentnosti raspolaganja sredstvima Fondacije (Pravilnik o pokroviteljstvu i donacijama). Donator može u svakom trenutku povući pristanak na objavljivanje imena i prezimena; ime se tada uklanja iz liste, a donacija ostaje u listi iznosom i datumom. Ime se uklanja iz liste i prestankom statusa korisnika."
    : "Donacija je anonimna. Ime Donatora se ne beleži uz zapis donacije i ne objavljuje se; donacija se u listi donacija navodi samo iznosom i datumom.";

  return [
    "UGOVOR O DONACIJI",
    "",
    `Zaključen dana ${datum} između:`,
    `1) ${donator} (u daljem tekstu: Donator), i`,
    `2) ${FONDACIJA} (u daljem tekstu: Fondacija).`,
    "",
    "Član 1 — Predmet",
    `Donator je Fondaciji dobrovoljno i bez naknade dao novčani iznos od ${broj(p.iznosRSD)} RSD. Fondacija donaciju prihvata i obavezuje se da je upotrebi isključivo za ostvarivanje ciljeva zbog kojih je osnovana, u skladu sa Statutom.`,
    ...(p.uplatilac
      ? [
          `Uplata je izvršena sa računa koji glasi na: ${p.uplatilac}. Doprinos se evidentira isključivo u zapis korisnika čijim je sredstvima uplata izvršena (Pravilnik o pokroviteljstvu i donacijama).`,
        ]
      : []),
    "",
    "Član 2 — Odsustvo protivčinidbe",
    "Donacija je bez naknade. Donator donacijom ne pribavlja nijedno dobro ni uslugu, ne stiče potraživanje prema Fondaciji, pravo na povraćaj donacije, pravo na otkup POEN-a niti neposredan uticaj u odlučivanju o pravilima sistema.",
    "Fondacija se donacijom ni na šta ne obavezuje prema Donatoru osim na namensku upotrebu iz člana 1.",
    "",
    "Član 3 — Evidentiranje doprinosa",
    "Doprinos koji se povodom donacije evidentira po pravilima KOLO sistema ne određuje se ovim ugovorom. Taj upis nije protivčinidba za donaciju i Donator na njega nema potraživanje.",
    "",
    "Član 4 — Javnost donacije",
    clan4,
    "",
    "Član 5 — Poreske obaveze",
    "Poreske obaveze koje eventualno proizlaze iz donacije svaka strana snosi u skladu sa važećim propisima.",
    "",
    "Član 6 — Zaključenje",
    "Ugovor je zaključen prihvatanjem donacije od strane Fondacije. Sačinjen je u elektronskom obliku i isporučuje se Donatoru kroz Platformu.",
    "",
    `Zapis donacije: ${p.zapisId}`,
    `Datum potvrde: ${datum}`,
  ].join("\n");
}
