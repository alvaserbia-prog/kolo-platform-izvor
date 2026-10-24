/**
 * Spisak za poziv (Pravilnik o dokazu stvarnosti čl. 4a; Uslovi korišćenja čl. 16b;
 * Registar radnji obrade br. 24; set 4.8.3) — ČISTA pravila, bez Prisme.
 *
 * Korisnik koji ne poznaje nijednog člana Kola dolazi na spisak za poziv po jednom
 * od četiri osnova (čl. 4a st. 2): sam zatraži razgovor („Želim da me neko
 * nazove"), javna donacija od praga, novčano pokroviteljstvo po prijavi koju je
 * podneo, prijava gazdinstva kojom je nosilac (i van RPG, set 4.8.3). Član Kola ga
 * posle razgovora uvodi u Kolo (čl. 5 st. 7, 5a). Na isti spisak dolazi i član bez
 * potvrde koji traži razgovor radi potvrde (čl. 5c); taj red vide samo čuvari Kola,
 * a upisnik ZRNA je prvi (čl. 4a).
 *
 * 🔴 Dospeće na spisak NE potvrđuje stvarnost (čl. 4a st. 6). Potvrda uplatom i
 * izvodom iz registra (set 4.8.0) je ukinuta: donacija, pokroviteljstvo i
 * gazdinstvo korisnika samo NUDE spisak, a od spiska ne zavise ni oni ni doprinos
 * evidentiran po njima.
 *
 * 🔴 Prag je u DINARIMA i meri UPLATU, nikad POEN (zabrana dinarske kape na POEN
 * ostaje). Prag se čita odavde, ne prepisuje se u ekrane (pravilo 10).
 *
 * Bez Prisme: uvozi ga i pretraživač.
 */
import { sme, SVI_STATUSI, type StatusUcesnika } from "./status-ucesnika-pravila";

/** Najmanja pojedinačna javna donacija koja vodi na spisak (čl. 4a st. 2 t. 2). Ime ostaje (pravilo 12). */
export const PRAG_POTVRDE_UPLATOM_RSD = 5_000;

/**
 * Osnovi dospeća na spisak (čl. 4a st. 2) — iste vrednosti kao enum `OsnovSpiska` u
 * šemi. `POTVRDA` je zahtev člana bez potvrde za razgovor radi potvrde (čl. 5c st. 3;
 * set 4.8.3); `GAZDINSTVO_RPG` od seta 4.8.3 znači svako gazdinstvo (ime ostaje).
 */
export const OSNOVI_SPISKA = ["ZAHTEV", "DONACIJA", "POKROVITELJSTVO", "GAZDINSTVO_RPG", "POTVRDA"] as const;
export type OsnovSpiska = (typeof OSNOVI_SPISKA)[number];

export function jeOsnovSpiska(x: unknown): x is OsnovSpiska {
  return typeof x === "string" && (OSNOVI_SPISKA as readonly string[]).includes(x);
}

/**
 * Na spisak dolazi samo KORISNIK (Uslovi čl. 14 st. 6, 16b; tabela dozvola
 * `ULAZ_NA_SPISAK`). Član bez potvrde je već uveden u Kolo i spisak ne vidi ni kao
 * pozvani; dete ne dolazi na spisak (čl. 4a poslednji stav).
 */
export function smeNaSpisak(status: string): boolean {
  return (SVI_STATUSI as readonly string[]).includes(status) && sme("ULAZ_NA_SPISAK", status as StatusUcesnika);
}

/**
 * Na spisak radi potvrde dolazi samo ČLAN BEZ POTVRDE (čl. 5c st. 3; tabela dozvola
 * `ZAHTEV_RADI_POTVRDE`), i to kad ispunjava uslove iz čl. 5c st. 2 (domensko).
 */
export function smeNaSpisakRadiPotvrde(status: string): boolean {
  return (SVI_STATUSI as readonly string[]).includes(status) && sme("ZAHTEV_RADI_POTVRDE", status as StatusUcesnika);
}

/**
 * Ko sme da vidi i otvori red na spisku (čl. 4a): zahtev radi potvrde samo čuvar
 * Kola (`POTVRDJUJE_TELEFONOM`), sve ostalo svaki član Kola.
 */
export function smeVidetiRed(osnov: OsnovSpiska, posmatrac: StatusUcesnika): boolean {
  return osnov === "POTVRDA" ? sme("POTVRDJUJE_TELEFONOM", posmatrac) : sme("VIDI_SPISAK_ZA_POZIV", posmatrac);
}

export type DonacijaZaSpisak = {
  /** Anonimna donacija ne vodi na spisak: po njoj se ništa ne pripisuje licu. */
  javno: boolean;
  /** Iznos JEDNE uplate — zbir više manjih ne ispunjava uslov. */
  iznosRsd: number;
  /** Ime uplatioca iz izvoda poklapa se sa imenom korisnika. */
  imeSePoklapa: boolean;
  /** Uplatilac ne stoji uz drugi nalog (mera C-1). */
  uplatilacJedinstven: boolean;
  maloletan: boolean;
};

/** Da li javna donacija vodi korisnika na spisak (čl. 4a st. 2 t. 2, st. 3). */
export function donacijaVodiNaSpisak(u: DonacijaZaSpisak): boolean {
  return (
    u.javno &&
    !u.maloletan &&
    u.imeSePoklapa &&
    u.uplatilacJedinstven &&
    u.iznosRsd >= PRAG_POTVRDE_UPLATOM_RSD
  );
}

/**
 * Da li pokroviteljstvo vodi podnosioca na spisak (čl. 4a st. 2 t. 3). Samo novac:
 * pokroviteljstvo dobrima i uslugama ne vodi na spisak (st. 3).
 */
export function pokroviteljstvoVodiNaSpisak(p: { novcano: boolean; maloletan: boolean }): boolean {
  return p.novcano && !p.maloletan;
}

/**
 * Da li prijava gazdinstva vodi podnosioca na spisak (čl. 4a st. 2 t. 4; set 4.8.3):
 * on je nosilac, a status mu je korisnik — bez obzira na to da li je gazdinstvo
 * upisano u Registar.
 */
export function gazdinstvoVodiNaSpisak(g: { nosilac: boolean; status: string; maloletan: boolean }): boolean {
  return g.nosilac && !g.maloletan && smeNaSpisak(g.status);
}
