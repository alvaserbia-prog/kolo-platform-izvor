/**
 * Pristanak — tekstovi i pravila. ČISTE funkcije (bez Prisme).
 *
 * ─── Zašto ovo postoji (R-06) ───────────────────────────────────────────────
 *
 * ZZPL čl. 15 st. 1: ako se obrada zasniva na pristanku, rukovalac mora biti u
 * stanju da DOKAŽE da je lice pristanak dalo. Teret je na nama, ne na licu.
 *
 * Do seta 4.6.3 sistem nije imao nijedan takav dokaz. Kvačice pri registraciji
 * proveravao je samo pretraživač (`canSubmit`), a `POST /api/registracija` nije
 * primao nijedno polje o prihvatanju niti upisivao ijedan red — nalog se otvarao i
 * bez ijedne kvačice, čim se zaobiđe obrazac. Time nije nedostajao samo dokaz
 * pristanka nego i dokaz da je ugovor zaključen, a „izvršenje ugovornog odnosa"
 * (ZZPL čl. 12 st. 1 t. 2) je pravni osnov za većinu obrada iz Politike čl. 4.
 *
 * ─── Šta se snima ───────────────────────────────────────────────────────────
 *
 * Tekst koji je čovek video, na jeziku na kom mu je prikazan, uz verziju akta.
 *
 * 🟢 Ne snima se ceo akt: pravilo bumpovanja obezbeđuje da objavljen fajl nikad ne
 * promeni sadržaj, pa `uslovi_koriscenja_4_6_6.md` trajno govori ono što je govorio
 * na dan pristanka. Verzija je pokazivač na nepromenljiv dokument.
 *
 * 🔴 Tekst se sklapa iz ISTIH prevodnih ključeva iz kojih se prikazuje. Prepisan
 * tekst u ovoj datoteci živeo bi dvaput i razišao bi se pri prvoj izmeni copy-ja —
 * a onda bi snimak tvrdio da je čovek video nešto što nije. Isti kvar koji je u
 * CLAUDE.md već zapisan kod tabela („ne prepisivati tabele u ekrane").
 *
 * 🔴 Ne snimaju se IP adresa ni podaci o uređaju. Vidi `ZapisPristanka` u šemi.
 */
import { prevedi } from "./prevod-servera";
import { AKT_POLITIKA, AKT_USLOVI, VERZIJA_PRISTANKA_KOLACICI } from "./verzije-akata";

export type VrstaPristankaKod = "USLOVI_KORISCENJA" | "POLITIKA_PRIVATNOSTI" | "KOLACICI_ANALITIKA";

/** Gde je pristanak dat — ide u `ZapisPristanka.izvor`. */
/**
 * Odakle je pristanak stigao. `gejt` je ekran „Sistem je unapređen" — jedini
 * put kojim dokaz pristanka može da nastane za nalog otvoren pre R-06.
 */
export type IzvorPristanka = "registracija" | "oauth" | "kolacici" | "gejt";

export type StavkaPristanka = {
  vrsta: VrstaPristankaKod;
  verzija: string;
  tekst: string;
  jezik: string;
};

/**
 * Tekst pristanka na jedan akt, na jeziku korisnika.
 *
 * Verzija se navodi izričito — i u snimku i na ekranu. Bez nje čovek ne zna na šta
 * pristaje, a mi ne znamo šta smo mu pokazali.
 */
export function tekstPristankaNaAkt(vrsta: Exclude<VrstaPristankaKod, "KOLACICI_ANALITIKA">, jezik: string): StavkaPristanka {
  const akt = vrsta === "USLOVI_KORISCENJA" ? AKT_USLOVI : AKT_POLITIKA;
  const kljucNaziva =
    vrsta === "USLOVI_KORISCENJA" ? "registracija.uslovi_link" : "registracija.privatnost_link";
  const naziv = prevedi(jezik, kljucNaziva);
  return {
    vrsta,
    verzija: akt.verzija,
    tekst: prevedi(jezik, "pristanak.zapis_akt", { naziv, verzija: akt.verzija }),
    jezik,
  };
}

/** Tekst pristanka na analitičke kolačiće — ono što stoji u banneru. */
export function tekstPristankaNaKolacice(jezik: string): StavkaPristanka {
  return {
    vrsta: "KOLACICI_ANALITIKA",
    verzija: VERZIJA_PRISTANKA_KOLACICI,
    tekst: prevedi(jezik, "kolacici.tekst"),
    jezik,
  };
}

/**
 * Oba pristanka koja se traže pri otvaranju naloga.
 *
 * 🔴 DVA reda, ne jedan. ZZPL čl. 15 st. 2 traži da pristanak koji se odnosi na
 * više pitanja bude razdvojen — Uslovi i Politika su dva pitanja, imaju odvojene
 * kvačice na ekranu i odvojeno se dokazuju. Spojeni u jedan zapis, ne bi se moglo
 * pokazati da je razdvojenost postojala.
 */
export function pristanciPriRegistraciji(jezik: string): StavkaPristanka[] {
  return [
    tekstPristankaNaAkt("USLOVI_KORISCENJA", jezik),
    tekstPristankaNaAkt("POLITIKA_PRIVATNOSTI", jezik),
  ];
}

/**
 * Da li su prihvaćena OBA akta.
 *
 * 🔴 Server mora da proveri isto što i obrazac. Do R-06 je `canSubmit` u
 * pretraživaču bio jedina brana, a pretraživač nikad nije poslednja reč — isti
 * razlog iz kog `smeDaVidiOglas` mora da se zove iz svakog prikaza, a ne da stoji
 * kao ispravno pravilo koje niko ne poziva.
 */
export function oba(prihvatamUslove: unknown, prihvatamPolitiku: unknown): boolean {
  return prihvatamUslove === true && prihvatamPolitiku === true;
}

export const PORUKA_PRISTANAK_OBAVEZAN =
  "Da nastaviš, prihvati Uslove korišćenja i Politiku privatnosti.";
