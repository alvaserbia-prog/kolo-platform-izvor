/**
 * Izjava izvršioca uz prijavu na zadatak operativnog doprinosa (Pravilnik o
 * operativnom doprinosu, čl. 10 al. 3). ČISTA funkcija — bez Prisme, jer tekst
 * prikazuje i obrazac u pretraživaču.
 *
 * Zašto ovaj dokument postoji: do 4.4.4 je pravnu prirodu operativnog doprinosa
 * tvrdila ISKLJUČIVO Fondacija, u pravilniku koji sama piše. Kad neko spolja
 * pita „jeste li ovom čoveku platili rad?", jednostrana izjava je slab dokaz.
 * Izjavom to isto kaže i sam izvršilac — isti posao koji ugovor o donaciji
 * (čl. 5b Pravilnika o pokroviteljstvu i donacijama) radi za donaciju.
 *
 * Odredba postoji od prve verzije akta; kod je do sada nije prikupljao, pa je
 * pravilnik propisivao dokaz koji nikad nije nastajao.
 *
 * 🔴 Tekst se SNIMA na prijavu (`OglasPrijava.izjavaTekst`) i posle toga se ne
 * menja — dokument mora da govori ono što je govorio u trenutku prijave, bez
 * obzira na kasnije izmene pravilnika. Ne generisati ga ponovo pri čitanju.
 *
 * 🔴 Tekst je na SRPSKOM na svim jezicima, kao ugovor o donaciji i ugovor o
 * pokroviteljstvu: to je pravni dokument po srpskom pravu, a merodavan je
 * srpski original.
 */

export type UlazIzjaveIzvrsioca = {
  /** Naziv zadatka na koji se prijava podnosi. */
  nazivZadatka: string;
  /** Predloženi POEN zadatka; 0 znači da zadatak nije naveo iznos. */
  predlozeniPoen: number;
};

function broj(n: number): string {
  return n.toLocaleString("sr-RS");
}

export function generisiIzjavuIzvrsioca(p: UlazIzjaveIzvrsioca): string {
  const iznos =
    p.predlozeniPoen > 0
      ? `Predloženi POEN ovog zadatka iznosi ${broj(p.predlozeniPoen)}.`
      : "Ovaj zadatak ne navodi predloženi POEN.";

  return [
    `Prijavljujem se dobrovoljno za izvršenje zadatka „${p.nazivZadatka}".`,
    "",
    "Znam da je operativni doprinos doprinos zajedničkom dobru, a ne posao naručen " +
      "od Fondacije ili od bilo kog drugog lica. Znam da mi se za izvršenje ne " +
      "isplaćuje nijedan iznos i ne daje nijedno dobro, nego mi se u evidenciji " +
      "Protokola beleži učinjen doprinos.",
    "",
    `Znam da predloženi POEN nije iznos koji ću dobiti. ${iznos} To je težinski ` +
      "koeficijent u raspodeli zajedničkog dnevnog limita, a stvarno evidentiran " +
      "broj zavisi od ukupne potražnje u obračunskom periodu i može biti manji.",
    "",
    "Znam da način izvršenja određujem sam i da mogu odustati u svakom trenutku, " +
      "bez obrazloženja i bez posledica osim izostanka evidencije za neizvršeni deo.",
    "",
    "Izjavu dajem u skladu sa članom 10 Pravilnika o operativnom doprinosu, " +
      "upoznat sa članovima 22 i 27 tog pravilnika.",
  ].join("\n");
}
