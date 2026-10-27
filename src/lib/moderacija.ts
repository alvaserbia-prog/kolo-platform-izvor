/**
 * Moderacija korisničkog sadržaja (oglasi na Pijaci, poruke u Pričaonici).
 *
 * Pravni osnov — Uslovi korišćenja:
 *  - čl. 29 st. 2: Fondacija NIJE obavezna da unapred pregleda sadržaj. Zato ovde
 *    nema automatskog filtriranja reči ni pre-moderacije — samo reaktivno uklanjanje.
 *  - čl. 29 st. 2: Fondacija može ukloniti sadržaj koji krši Uslove, Pravilnik ili
 *    zakon, ili koji su drugi korisnici prijavili kao problematičan, i pritom
 *    „obaveštava korisnika o uklanjanju uz navođenje razloga".
 *  - čl. 23 st. 5: isto pravilo posebno za zabranjena dobra i usluge.
 *
 * Iz čl. 29 st. 2 sledi ključno pravilo ovog modula: **razlog je obavezan pri
 * svakom uklanjanju** i uvek se šalje vlasniku sadržaja. Uklanjanje bez razloga
 * nije predviđeno aktima, pa ga rute odbijaju sa 400.
 *
 * Šta ovde svesno NE postoji: izmena tuđeg oglasa od strane Fondacije. Akti daju
 * pravo uklanjanja, ne prepravke — prepravkom bi Fondacija postala koautor
 * sadržaja i izgubila zaštitu iz čl. 29 st. 2. Umesto toga vlasnik dobija razlog
 * i sam ispravlja i ponovo objavljuje.
 */

/** Gornja granica dužine razloga — ide u notifikaciju, email i audit log. */
export const MAX_RAZLOG = 500;

/**
 * Koliko uklonjenih oglasa istog korisnika okida admin upozorenje.
 * Ponovljeno kršenje posle izrečene suspenzije je osnov za isključenje
 * (Uslovi čl. 32), pa je ovo signal da se predmet pogleda celovito —
 * NIJE automatska sankcija.
 */
export const PRAG_ZA_UPOZORENJE = 3;

export type PrijavaRazlogKod =
  | "ZABRANJENO_DOBRO"
  | "OBMANA"
  | "UVREDLJIVO"
  | "LICNI_PODACI"
  | "PREVARA"
  | "TRGOVINA_POENOM"
  | "DRUGO";

export const PRIJAVA_RAZLOZI: PrijavaRazlogKod[] = [
  "ZABRANJENO_DOBRO",
  "OBMANA",
  "UVREDLJIVO",
  "LICNI_PODACI",
  "PREVARA",
  "TRGOVINA_POENOM",
  "DRUGO",
];

/** Srpski opis razloga — koristi se u admin panelu, notifikacijama i audit logu. */
export const RAZLOG_OPIS: Record<PrijavaRazlogKod, string> = {
  ZABRANJENO_DOBRO: "Zabranjeno dobro ili usluga (Uslovi čl. 23)",
  OBMANA: "Lažan ili obmanjujuć oglas (Uslovi čl. 22)",
  UVREDLJIVO: "Uvredljiv, preteći ili diskriminatorski sadržaj (Uslovi čl. 27)",
  LICNI_PODACI: "Lični podaci trećeg lica (Uslovi čl. 28)",
  PREVARA: "Prevara ili druga nezakonita aktivnost (Uslovi čl. 28)",
  TRGOVINA_POENOM: "Trgovina POENIMA za novac (Uslovi čl. 23 st. 2 i čl. 28 st. 3; Pravilnik čl. 20 st. 4)",
  DRUGO: "Drugo",
};

/**
 * Standardno obrazloženje uklanjanja oglasa prijavljenog kao trgovina POEN-om za
 * novac. Admin ga dobija unapred upisanog i sme da ga izmeni pre slanja.
 */
export const OBRAZLOZENJE_TRGOVINA_POENOM =
  "Oglas je uklonjen jer se njime nudi ili traži zamena POENA za novac, što nije dozvoljeno (Uslovi korišćenja, čl. 23 st. 2 i čl. 28 st. 3).";

export function jeRazlogPrijave(v: unknown): v is PrijavaRazlogKod {
  return typeof v === "string" && (PRIJAVA_RAZLOZI as string[]).includes(v);
}

export type ProveraRazloga =
  | { ok: true; razlog: string }
  | { ok: false; greska: string };

/**
 * Validacija razloga uklanjanja. Prazan razlog se odbija jer bi obaveštenje
 * korisniku ostalo bez obrazloženja koje Uslovi čl. 29 st. 2 traže.
 */
export function proveriRazlog(ulaz: unknown): ProveraRazloga {
  const razlog = typeof ulaz === "string" ? ulaz.trim() : "";
  if (!razlog) return { ok: false, greska: "Razlog uklanjanja je obavezan." };
  if (razlog.length > MAX_RAZLOG)
    return { ok: false, greska: `Razlog može imati najviše ${MAX_RAZLOG} znakova.` };
  return { ok: true, razlog };
}

/** Tekst obaveštenja vlasniku uklonjenog oglasa (čl. 23 st. 5, čl. 29 st. 2). */
export function tekstObavestenjaOglas(naslov: string, razlog: string): string {
  return (
    `Tvoj oglas „${naslov}" je uklonjen sa Pijace.\n\n` +
    `Razlog: ${razlog}\n\n` +
    `Ispravljen oglas možeš ponovo objaviti. Ako smatraš da je odluka pogrešna, ` +
    `možeš podneti prigovor Fondaciji (Uslovi korišćenja čl. 40).`
  );
}

/** Tekst obaveštenja autoru uklonjene poruke iz Pričaonice (čl. 29 st. 2). */
export function tekstObavestenjaPoruka(razlog: string): string {
  return (
    `Tvoja poruka iz Pričaonice je uklonjena.\n\n` +
    `Razlog: ${razlog}\n\n` +
    `Ako smatraš da je odluka pogrešna, možeš podneti prigovor Fondaciji ` +
    `(Uslovi korišćenja čl. 40).`
  );
}
