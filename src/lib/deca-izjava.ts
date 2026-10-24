/**
 * Izjava roditelja o postojanju deteta (Pravilnik o učešću dece, čl. 6 st. 1).
 * ČISTA funkcija — bez Prisme, jer tekst prikazuje i obrazac u pretraživaču.
 *
 * ─── Zašto ovaj dokument postoji ────────────────────────────────────────────
 *
 * Do seta 4.5.2 je postupak iz čl. 6 pitao SAMO potvrđivače roditelja. Tvrdnja
 * „ovaj čovek ima dete tog uzrasta" time je počivala isključivo na ljudima koji
 * to znaju posredno, dok je onaj koji jedini zna pouzdano — sam roditelj — u
 * postupku ćutao. Uz to je izostanak izjašnjenja obarao vezu u grafu, dakle
 * pogađao OBA njena člana, a izjašnjenje se tražilo samo od jednog.
 *
 * Sada potvrda opstaje samo ako su se izjasnile obe strane veze: potvrđivač
 * odgovorom, roditelj ovom izjavom. Roditelj je po pravilu daje u trenutku u kome
 * preuzima odgovornost za nalog — pri otvaranju naloga (čl. 4) ili pri njegovom
 * preuzimanju (čl. 4b) — pa mu rok ne teče.
 *
 * 🔴 Tekst se SNIMA na vezu roditelj–dete (`Roditeljstvo.izjavaTekst`) i posle
 * toga se ne menja — isti razlog kao kod ugovora o donaciji i izjave izvršioca:
 * dokument mora da govori ono što je govorio u trenutku davanja, bez obzira na
 * kasnije izmene pravilnika. Ne generisati ga ponovo pri čitanju.
 *
 * 🔴 Tekst je na SRPSKOM na svim jezicima: to je izjava pod punom odgovornošću
 * po srpskom pravu, a merodavan je srpski original.
 *
 * ─── 🔴 Saglasnost na obradu je IZDVOJENA (R-06, 14.09.2026) ────────────────
 *
 * Do seta 4.6.3 je ova izjava nosila i rečenicu „pristajem na obradu njegovih
 * podataka". Time su dve izjave različitog dejstva stajale u jednom tekstu:
 *
 *  - izjava o postojanju deteta je tvrdnja o ČINJENICI i daje se pod punom
 *    odgovornošću (čl. 6 st. 1);
 *  - saglasnost na obradu podataka deteta (ZZPL čl. 16) povlači se u svakom
 *    trenutku, bez razloga i bez posledica po bilo koga drugog (čl. 15 st. 3).
 *
 * Spojene, opoziv saglasnosti se nije mogao izvršiti a da ne obori i tvrdnju o
 * postojanju deteta — dakle pravo na opoziv faktički nije postojalo. Sada su dva
 * teksta i dva para polja (`izjava*` i `saglasnost*`), a daju se u istom potezu,
 * pa roditelj i dalje radi jednom.
 */

import { prevedi } from "./prevod-servera";

export type UlazIzjaveRoditelja = {
  /** Pseudonim naloga maloletnog korisnika na koji se izjava odnosi. */
  pseudonimDeteta: string;
  /** Uzrast deteta u godinama, izveden iz datuma rođenja koji roditelj navodi. */
  godine: number;
};

export function generisiIzjavuRoditelja(p: UlazIzjaveRoditelja): string {
  return [
    `Pod punom odgovornošću izjavljujem da sam roditelj odnosno zakonski zastupnik ` +
      `deteta uzrasta ${p.godine} godina, za koje je otvoren nalog „${p.pseudonimDeteta}".`,
    "",
    "Izjavljujem da dete stvarno postoji i da je navedeni uzrast tačan.",
    "",
    "Znam da za radnje deteta na Platformi odgovaram ja. Znam da nalog deteta " +
      "postaje dete Kola tek kada sam član Kola i kada član Kola koji me lično zna " +
      "potvrdi da imam to dete.",
    "",
    // Posledica je samo isključenje (čl. 4e, Uslovi čl. 28); rečenica o poništenju
    // zapisa nije imala osnov u aktu i skinuta je 24.10.2026 (paket F, F7-3).
    // Snimljene izjave ostaju kakve su (pravilo 11).
    "Znam da je lažna izjava o roditeljstvu teža povreda pravila sistema, za " +
      "koju se obavezno izriče isključenje.",
    "",
    "Izjavu dajem u skladu sa članom 6 Pravilnika o učešću dece.",
  ].join("\n");
}

export type UlazSaglasnostiRoditelja = {
  /** Pseudonim naloga maloletnog korisnika na koji se saglasnost odnosi. */
  pseudonimDeteta: string;
};

/**
 * Saglasnost roditelja na obradu podataka deteta (ZZPL čl. 16; Politika 4.7).
 *
 * 🔴 Za razliku od izjave iznad, ovaj tekst ide na JEZIKU RODITELJA. Izjava je
 * pravni dokument po srpskom pravu i merodavan joj je srpski original; saglasnost
 * je pristanak, a ZZPL čl. 15 st. 2 traži da pristanak bude dat „jasnim i
 * jednostavnim jezikom" — dakle jezikom onoga ko ga daje. Ne ujednačavati ih.
 *
 * Prevod stoji uz ostale tekstove pristanka, pa se menja zajedno sa njima.
 */
export function generisiSaglasnostRoditelja(p: UlazSaglasnostiRoditelja, jezik: string): string {
  return prevedi(jezik, "pristanak.saglasnost_roditelja", { pseudonim: p.pseudonimDeteta });
}
