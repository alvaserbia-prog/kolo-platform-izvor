/**
 * Ugovor o donaciji fizičkog lica (Pravilnik o pokroviteljstvu i donacijama,
 * čl. 5b). ČISTA funkcija — bez Prisme, jer tekst prikazuje i stranica u
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

const FONDACIJA = "KOLO Fondacija, matični broj 28836627, PIB 115840443";

export type UlazUgovoraODonaciji = {
  /** Ime i prezime donatora; null za anonimnu donaciju. */
  ime: string | null;
  pseudonim: string;
  iznosRSD: number;
  /** Evidentirani POEN (0 za anonimnu donaciju). */
  poen: number;
  nivo: number;
  koeficijent: number;
  javno: boolean;
  /** Identifikator zapisa donacije — veza dokumenta sa evidencijom. */
  zapisId: string;
  datum: Date;
  /**
   * Ime uplatioca iz bankovnog izvoda (čl. 3). Null za zatečene donacije i za
   * tokove u kojima izvod još nije pročitan.
   */
  uplatilac?: string | null;
};

function broj(n: number): string {
  return n.toLocaleString("sr-RS");
}

export function generisiUgovorODonaciji(p: UlazUgovoraODonaciji): string {
  const datum = p.datum.toLocaleDateString("sr-RS");
  const donator = p.javno
    ? `${p.ime ?? p.pseudonim}, korisnik KOLO platforme pod pseudonimom ${p.pseudonim}`
    : `korisnik KOLO platforme pod pseudonimom ${p.pseudonim}`;

  const clan3 = p.javno
    ? [
        `Povodom donacije Protokol je u zapis Donatora upisao ${broj(p.poen)} POEN. Upis je automatski akt Protokola u smislu čl. 39 i čl. 73 Pravilnika o KOLO sistemu, a ne protivčinidba za donaciju.`,
        "POEN je interna obračunska jedinica kojom se evidentira doprinos zajedničkom dobru. Nema vrednost van sistema, ne predstavlja novac, elektronski novac, platno sredstvo, digitalnu imovinu ni imovinsko pravo, ne predstavlja potraživanje prema Fondaciji, ne otkupljuje se i ne konvertuje u dinare (čl. 12 i čl. 13 Pravilnika o KOLO sistemu).",
      ]
    : [
        "Donacija je anonimna, pa se POEN po njenom osnovu ne evidentira i ona ne ulazi u kumulativni nivo donacija.",
      ];

  const clan4 = p.javno
    ? [
        `Koeficijent evidencije primenjen na ovu donaciju iznosi ${p.koeficijent.toFixed(2).replace(".", ",")} i odgovara nivou ${p.nivo} iz čl. 4 Pravilnika o pokroviteljstvu i donacijama.`,
        "Koeficijent evidencije nije cena POEN-a i ne izražava vrednost donacije. Njime se izražava mera uvažavanja doprinosa zajedničkom dobru i on ne stvara nijedno pravo Donatora.",
      ]
    : ["Koeficijent evidencije se na anonimnu donaciju ne primenjuje."];

  const clan5 = p.javno
    ? "Donacija je javna. Ime i prezime Donatora beleže se uz zapis donacije i objavljuju u listi donacija dostupnoj potvrđenim korisnicima, radi transparentnosti sredstava Fondacije i provere osnova po kome je POEN upisan (čl. 5a Pravilnika o pokroviteljstvu i donacijama). Donator može u svakom trenutku povući pristanak na objavljivanje imena i prezimena; ime se tada uklanja iz liste, a donacija ostaje u listi iznosom, datumom i pseudonimom. Ime se uklanja iz liste i prestankom svojstva korisnika."
    : "Donacija je anonimna. Ime Donatora se ne beleži uz zapis donacije i ne objavljuje se.";

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
          `Uplata je izvršena sa računa koji glasi na: ${p.uplatilac}. Doprinos se evidentira isključivo u zapis korisnika čijim je sredstvima uplata izvršena (čl. 3 Pravilnika o pokroviteljstvu i donacijama).`,
        ]
      : []),
    "",
    "Član 2 — Odsustvo protivčinidbe",
    "Donacija je bez naknade. Donator donacijom ne pribavlja nijedno dobro ni uslugu, ne stiče potraživanje prema Fondaciji, pravo na povraćaj donacije, pravo na otkup POEN-a niti uticaj u odlučivanju o pravilima sistema.",
    "Fondacija se donacijom ni na šta ne obavezuje prema Donatoru osim na namensku upotrebu iz člana 1.",
    "",
    "Član 3 — Evidentiranje doprinosa",
    ...clan3,
    "",
    "Član 4 — Koeficijent evidencije",
    ...clan4,
    "",
    "Član 5 — Javnost donacije",
    clan5,
    "",
    "Član 6 — Poreske obaveze",
    "Poreske obaveze koje eventualno proizlaze iz donacije svaka strana snosi u skladu sa važećim propisima.",
    "",
    "Član 7 — Zaključenje",
    "Ugovor je zaključen prihvatanjem donacije od strane Fondacije. Sačinjen je u elektronskom obliku i isporučuje se Donatoru kroz Platformu.",
    "",
    `Zapis donacije: ${p.zapisId}`,
    `Datum potvrde: ${datum}`,
  ].join("\n");
}
