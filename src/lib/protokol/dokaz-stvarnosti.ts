/**
 * Domain logika dokaza stvarnosti (Pravilnik o dokazu stvarnosti, set 4.8.0).
 *
 * 🔴 Od seta 4.8.0 indeksa stvarnosti nema: korisnik je potvrđen ili nije, jednom
 * važećom verifikacijom (čl. 2). Kolona `indeksStvarnosti` ostaje kao interni
 * zapis te potvrđenosti (pravilo 12 — identifikatori se ne menjaju): ≥ 10 znači
 * potvrđen, 0 nije, početni korisnik nosi 100. Broj se NIGDE ne prikazuje kao
 * procenat — ekran čita `jePotvrdjen`. Zatečeni nalozi sa više potvrda (raniji čl. 22, brisan u setu 5.0)
 * zadržavaju veći broj, ali on ne znači ništa više od „potvrđen".
 *
 * Čiste funkcije bez Prisma poziva — prima podatke, vraća odluke.
 * Sve funkcije su deterministički testabilne.
 */
// Čist domen bez Prisme: uvozi ga i klijentski kod (raspored grafa verifikacija).
import { jeCuvar, type StatusUcesnika } from "@/lib/status-ucesnika-pravila";

export const FUNKCIONALNI_PRAG_INDEKSA = 10; // dokaz stvarnosti čl. 3 (interni zapis)
export const PRIRAST_INDEKSA_PO_VERIFIKACIJI = 10; // čl. 2
export const MAX_INDEKS = 100; // čl. 2 (interni zapis)
export const POEN_VERIFIKATOR = 1000; // čl. 19
export const POEN_VERIFIKOVANI = 1000; // čl. 19
export const POEN_NADZORNIK = 500; // zatečeni upisi; od seta 4.7.5 nadzor ne nosi POEN (čl. 19 st. 8)
// QR token TTL. Produžen sa 2 na 24 sata otkad je tabla jemstva ukinuta: dogovor
// o verifikaciji se sada vodi kroz poruke povodom oglasa, pa dve osobe retko stoje
// jedna pored druge u trenutku kad kod nastane.
export const TOKEN_VAZI_SEKUNDI = 24 * 60 * 60;
// Čl. 29 (od v3.9.2): indeks stvarnosti početnih korisnika iznosi 100% od
// uspostavljanja naloga i ne proizlazi iz lanca potvrda.
export const POCETNI_INDEKS = 100;
export type GrafZapis = { verifikatorId: string; verifikovaniId: string };

export type ProveraLancaRezultat =
  | { dozvoljeno: true }
  | { dozvoljeno: false; razlog: string };

/**
 * Izračunava indeks stvarnosti od broja verifikacija (čl. 2; interni zapis).
 * Vrednost je u opsegu 0-100; svaka verifikacija dodaje 10 procentnih poena;
 * verifikacije iznad praga 10 se ne evidentiraju (cap 100%).
 */
export function izracunajIndeks(brojVerifikacija: number): number {
  if (brojVerifikacija < 0) return 0;
  return Math.min(MAX_INDEKS, brojVerifikacija * PRIRAST_INDEKSA_PO_VERIFIKACIJI);
}

// 🔴 Verifikacioni kapacitet i slotovi (stari čl. 8–9) su ukinuti setom 4.7.5.
// Potvrđivanje ograničava samo dnevni tempo iz čl. 21 — `@/lib/potvrde-dnevno-pravila`.

export type VrstaVerifikacije = "POTVRDA" | "UVODJENJE";
export type IzvorPotvrdeClana = "CLAN_KOLA" | "FONDACIJA" | "LANAC";
/** Način potvrde uz izvor CLAN_KOLA (čl. 5, 16, 17; set 4.8.3) — isto kao enum u šemi. */
export type NacinPotvrdeClana = "LICNO" | "TELEFONOM" | "SPISAK_POVEZANIH";

/**
 * Da li verifikacija podleže nadzoru (dokaz stvarnosti čl. 22, 29 st. 5; set 4.8.2).
 *
 *  - osnivač: nikad, ni uvođenje sa spiska za poziv (čl. 29 st. 5);
 *  - čuvar Kola: samo uvođenje u Kolo posle razgovora telefonom sa korisnikom sa
 *    spiska za poziv (čl. 22 st. 1 t. 5);
 *  - svi ostali (član Kola koji nije čuvar, član bez potvrde): uvek (čl. 22 st. 1 t. 1).
 *
 * 🔴 Imunitet „NOSILAC_ZRNA ne podleže" je ukinut: čuvar je POTVRĐEN nosilac ZRNA,
 * a status se čita iz `statusUcesnika`, ne iz `tipKorisnika`.
 */
export function podlezeNadzoru(u: {
  verifikatorStatus: StatusUcesnika;
  vrsta: VrstaVerifikacije;
  poPozivu: boolean;
}): boolean {
  if (u.verifikatorStatus === "OSNIVAC") return false;
  if (u.verifikatorStatus === "CUVAR_KOLA") return u.vrsta === "UVODJENJE" && u.poPozivu;
  return true;
}

/**
 * Da li potvrda člana bez potvrde podleže nadzoru (čl. 5 st. 4, 16, 17, 22;
 * set 4.8.3).
 *
 *  - potvrda posle razgovora telefonom (čl. 16 st. 3) i potvrda uvodioca sa spiska
 *    povezanih (čl. 17 st. 3): uvek, i kad je daje čuvar ili osnivač;
 *  - automatska potvrda lanca (ukinuta setom 4.8.3, stari zapisi): uvek;
 *  - odluka Fondacije (čl. 5 st. 1 t. 4): ne — čl. 22 st. 2; trag ide u audit
 *    (otvoreno pitanje 2 specifikacije);
 *  - potvrda koju daje osnivač ili čuvar Kola: ne (čl. 22 st. 2);
 *  - potvrda koju daje član Kola koji nije čuvar: da (čl. 22 st. 1 t. 2).
 *
 * Isto pravilo važi za potvrdu postojanja deteta (deca čl. 13 st. 5; dokaz čl. 22 st. 1 t. 3)
 * sa izvorom `CLAN_KOLA`.
 */
export function podlezeNadzoruPotvrda(
  davalacStatus: StatusUcesnika | null,
  izvor: IzvorPotvrdeClana,
  opcije: { nacin?: NacinPotvrdeClana | null; premaUvodiocu?: boolean } = {},
): boolean {
  if (izvor === "LANAC") return true;
  if (izvor === "CLAN_KOLA" && (opcije.nacin === "TELEFONOM" || opcije.premaUvodiocu)) return true;
  if (izvor === "FONDACIJA") return false;
  return !(davalacStatus && jeCuvar(davalacStatus));
}

/**
 * Indeks početnog korisnika je fiksno 100 i ne menja se nijednom operacijom —
 * ni verifikacijom, ni padom/prestankom verifikatora, ni kaskadom poništavanja
 * (čl. 29 i 30 Pravilnika o dokazu stvarnosti; od v3.9.2). Za ostale korisnike
 * vraća izračunatu vrednost nepromenjenu.
 */
export function zasticeniIndeks(jePocetni: boolean, izracunato: number): number {
  return jePocetni ? POCETNI_INDEKS : izracunato;
}

/**
 * Lanac bez kruga (čl. 28, set 4.8.0): verifikator ne potvrđuje nikoga iz svoje
 * uzlazne linije — onoga ko je njega potvrdio, ni nikoga iznad, do početnog.
 *
 * Zabranjena zona i anti-cirkularno pravilo ukinuti su pravilom o jednoj potvrdi:
 * meta je uvek nepotvrđena, pa nema svoju liniju naviše. Krug može nastati samo
 * kad je meti potvrda poništena (čl. 37), a ona je pre toga uvela nekoga u lanac
 * — tada je meta predak verifikatora, i to je jedini slučaj koji ovo hvata.
 * Krug poznanstava i doprinos razmeni (čl. 40b) ukinuti su istim setom.
 */
export function proveriLanacBezKruga(
  verifikatorId: string,
  verifikovaniId: string,
  graf: GrafZapis[]
): ProveraLancaRezultat {
  if (verifikatorId === verifikovaniId) {
    return { dozvoljeno: false, razlog: "Ne možeš da potvrdiš samog sebe." };
  }
  if (predciULanca(verifikatorId, graf).has(verifikovaniId)) {
    return {
      dozvoljeno: false,
      razlog: "Ne možeš da potvrdiš nekoga ko je tebe uveo u lanac potvrda (čl. 28 Pravilnika o dokazu stvarnosti).",
    };
  }
  return { dozvoljeno: true };
}

/** Svi preci čvora u lancu potvrda (bez samog čvora), do korenova. */
export function predciULanca(cvor: string, graf: GrafZapis[]): Set<string> {
  const roditelji = new Map<string, string[]>();
  for (const v of graf) {
    const r = roditelji.get(v.verifikovaniId);
    if (r) r.push(v.verifikatorId);
    else roditelji.set(v.verifikovaniId, [v.verifikatorId]);
  }
  const rezultat = new Set<string>();
  const stek = [...(roditelji.get(cvor) ?? [])];
  while (stek.length > 0) {
    const n = stek.pop()!;
    if (rezultat.has(n)) continue;
    rezultat.add(n);
    for (const p of roditelji.get(n) ?? []) stek.push(p);
  }
  return rezultat;
}
