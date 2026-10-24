/**
 * Nivoi donacija i koeficijent evidencije — ČISTE funkcije, bez Prisme.
 *
 * Zaseban fajl zato što ovu tabelu čita i admin ekran u pretraživaču. Dok je
 * stajala uz servisne funkcije (`protokol/donacija.ts`, koji uvozi Prismu),
 * klijent nije mogao da je uveze, pa je admin panel držao SOPSTVENU prepisanu
 * tabelu — i ta prepisana tabela je bila pogrešna: nosila je nivoe
 * POKROVITELJSTVA (7 nivoa, fiksan bonus) pod naslovom „Pragovi donacija".
 * Zato se sada čita odavde i ne može da odluta.
 *
 * `protokol/donacija.ts` sve ovo re-eksportuje, pa server ima jedan ulaz.
 */

import { procitajImePrezime } from "@/lib/identitet-pravila";

/**
 * Jedanaest nivoa, koeficijent od 1,00 do 2,00 (Pravilnik o pokroviteljstvu i
 * donacijama, čl. 4). Nivo 1 nema donji prag: pokriva svaku donaciju ispod
 * 5.000 RSD; Nivo 2 počinje na 5.000 RSD.
 *
 * Broj evidentiranih POENA = iznos donacije (RSD) × koeficijent evidencije
 * novodostignutog nivoa, primenjen na CELU novu donaciju. Nivo je kumulativan i
 * trajan. `do` je donji prag kumulativne donacije (RSD) za dati nivo.
 */
/*
 * 🔴 Prag provere porekla sredstava je UKINUT (registar 2026-10, mera N2-M1;
 * odluka vlasnika 24.10.2026): identifikaciju uplatioca i proveru porekla
 * sprovodi banka, koja je obveznik, a svaka donacija ide preko banke. Ne vraćati
 * prag ni izjavu o poreklu u ugovor — brana `n2-pranje-novca-izvor.test.ts`.
 */

/**
 * Najveći iznos JEDNE kartične uplate (R-01, mera M-11).
 *
 * 🔴 Kapa ne štiti POEN — to od mere M-4a radi ljudska potvrda. Ona štiti tri
 * druge stvari: (1) najgori pojedinačan gubitak po osporenoj transakciji, jer
 * rok za chargeback ide mesecima posle evidentiranja, a osnova za poništenje
 * POEN-a nema (mera M-12 je odbijena, pa POEN tada OSTAJE); (2) merchant nalog,
 * koji kartične šeme gase kad odnos osporenih transakcija pređe prag; (3)
 * osnivački kanal, koji jedna velika uplata može da isprazni u jednoj noći
 * (korak se pali na svakih 100.000 POEN opticaja).
 *
 * Veći iznos ide uplatom na račun (domaći) ili deviznom doznakom (inostranstvo),
 * gde se uplatilac vidi iz izvoda — što čl. 3 Pravilnika o pokroviteljstvu i
 * donacijama ionako traži.
 */
export const MAX_KARTICNA_UPLATA_RSD = 100_000;

/**
 * Brzinska kočnica (R-01, mera M-11): najviše toliko kartičnih zapisa po nalogu
 * u jednom danu, bez obzira na ishod.
 *
 * 🔴 Protiv druge pretnje nego kapa. Najverovatnija zloupotreba nije jedna
 * velika uplata nego *card testing* — provera ukradenih brojeva kartica nizom
 * sitnih donacija, jer nema isporuke robe ni provere kupca. Kapa po transakciji
 * protiv toga ne radi ništa.
 */
export const MAX_KARTICNIH_UPLATA_DNEVNO = 3;

/**
 * Normalizuje ime uplatioca u ključ za poređenje (mera C-1 uz R-01).
 *
 * Mala slova, bez dijakritike i interpunkcije, reči sortirane — pa se
 * „Petar Petrović", „PETROVIĆ PETAR" i „Petar  Petrovic" svode na isti ključ.
 * Sortiranje je bitno jer izvodi pišu ime i prezime u oba redosleda.
 *
 * Vraća `null` kad od imena ne ostane ništa upotrebljivo (kraće od tri znaka) —
 * tada se poređenje ne radi, umesto da se svi kratki unosi slože u isti ključ.
 */
export function normalizujUplatioca(ime: string | null | undefined): string | null {
  if (!ime) return null;
  const reci = ime
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort();
  const kljuc = reci.join(" ");
  return kljuc.length >= 3 ? kljuc : null;
}

export const RANG_TABELA: { nivo: number; do: number; kurs: number }[] = [
  { nivo: 1,  do:               0, kurs: 1.00 },
  { nivo: 2,  do:           5_000, kurs: 1.10 },
  { nivo: 3,  do:          10_000, kurs: 1.20 },
  { nivo: 4,  do:          20_000, kurs: 1.30 },
  { nivo: 5,  do:          50_000, kurs: 1.40 },
  { nivo: 6,  do:         100_000, kurs: 1.50 },
  { nivo: 7,  do:         200_000, kurs: 1.60 },
  { nivo: 8,  do:         500_000, kurs: 1.70 },
  { nivo: 9,  do:       1_000_000, kurs: 1.80 },
  { nivo: 10, do:       2_000_000, kurs: 1.90 },
  { nivo: 11, do:       5_000_000, kurs: 2.00 },
];
/**
 * 🔴 Tabela se NASTAVLJA BEZ KRAJA (odluka vlasnika, 2026-09-08). `RANG_TABELA`
 * gore je samo ZAKLJUČAN deo — jedanaest nivoa koji su objavljeni u aktu i koje
 * čuva test. Iznad njih pragovi idu istim nizom 1–2–5 (10.000.000, 20.000.000,
 * 50.000.000 …), a koeficijent raste za 0,10 po nivou. Bez plafona: sistem treba
 * da izdrži skok u opticaju pri velikoj donaciji.
 *
 * Prag se zato NE traži u nizu nego se računa, a niz služi kao provera.
 */

/** Korak koeficijenta po nivou (čl. 4). */
export const KORAK_KOEFICIJENTA = 0.1;

/** Najmanji iznos prijave pokroviteljstva (čl. 7) — ispod toga ugovor košta više. */
export const MINIMUM_PRIJAVE_POKROVITELJSTVA = 10_000;

/** Podaci o pokrovitelju i zastupniku iz prijave (čl. 7 st. 2, set 4.7.5). */
export type PodaciPrijavePokroviteljstva = {
  naziv: string;
  pib: string;
  maticniBroj: string;
  adresaSedista: string;
  zastupnikImePrezime: string;
  zastupnikFunkcija: string;
};

const MAX_POLJE = 200;
const MAX_FUNKCIJA = 60;

/**
 * Provera podataka iz prijave pokroviteljstva. PIB ima devet cifara, matični broj
 * osam (pravno lice i preduzetnik). Ime zastupnika ide kroz isto pravilo kao
 * svako ime u evidenciji identiteta (`procitajImePrezime`), jer se tamo i upisuje.
 */
export function procitajPrijavuPokroviteljstva(
  b: Record<string, unknown>,
): { ok: true; podaci: PodaciPrijavePokroviteljstva } | { ok: false; razlog: string } {
  const tekst = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
  const naziv = tekst(b.naziv);
  const pib = tekst(b.pib).replace(/\s/g, "");
  const maticniBroj = tekst(b.maticniBroj).replace(/\s/g, "");
  const adresaSedista = tekst(b.adresaSedista);
  const zastupnikFunkcija = tekst(b.zastupnikFunkcija);

  if (!naziv || naziv.length > MAX_POLJE) return { ok: false, razlog: "Upiši naziv pravnog lica ili preduzetnika." };
  if (!/^\d{9}$/.test(pib)) return { ok: false, razlog: "PIB ima devet cifara." };
  if (!/^\d{8}$/.test(maticniBroj)) return { ok: false, razlog: "Matični broj ima osam cifara." };
  if (adresaSedista.length < 5 || adresaSedista.length > MAX_POLJE)
    return { ok: false, razlog: "Upiši adresu sedišta." };
  const ime = procitajImePrezime(b.zastupnikImePrezime);
  if (!ime.ok) return { ok: false, razlog: `Zastupnik: ${ime.razlog}` };
  if (zastupnikFunkcija.length < 2 || zastupnikFunkcija.length > MAX_FUNKCIJA)
    return { ok: false, razlog: "Upiši funkciju zastupnika (npr. direktor, preduzetnik)." };

  return {
    ok: true,
    podaci: { naziv, pib, maticniBroj, adresaSedista, zastupnikImePrezime: ime.imePrezime, zastupnikFunkcija },
  };
}

/**
 * Donji prag kumulativa (RSD) za dati nivo. Nivo 1 nema prag (svaka donacija
 * nosi POEN), nivo 2 je 5.000, a od nivoa 3 naviše niz je 1–2–5 počev od 10.000.
 */
export function pragZaNivo(nivo: number): number {
  if (nivo <= 1) return 0;
  if (nivo === 2) return 5_000;
  const j = nivo - 3;
  const mantisa = [1, 2, 5][j % 3];
  return mantisa * Math.pow(10, 4 + Math.floor(j / 3));
}

/**
 * Koeficijent za dati nivo. Računa se u celim brojevima (stotinkama) — sa
 * `1 + (n-1) * 0.1` jedanaesti nivo daje 2.0000000000000004.
 */
export function koeficijentZaNivo(nivo: number): number {
  return (100 + (Math.max(1, nivo) - 1) * 10) / 100;
}



/**
 * Vraća nivo i koeficijent evidencije za dati kumulativni RSD iznos.
 * Svaki iznos (uključujući 0) je bar Nivo 1 (koeficijent 1,00).
 */
export function nivoZaKumulativ(kumulativRSD: number): { nivo: number; kurs: number } {
  // Nije pretraga po nizu nego penjanje po pragovima — tabela nema kraj.
  // `Number.isFinite` čuva petlju: Infinity bi je vrtelo beskonačno, NaN pada na
  // nivo 1 sam od sebe (poređenje sa NaN je uvek netačno).
  if (!Number.isFinite(kumulativRSD) || kumulativRSD < 0) return { nivo: 1, kurs: 1.0 };
  let nivo = 1;
  while (kumulativRSD >= pragZaNivo(nivo + 1)) nivo++;
  return { nivo, kurs: koeficijentZaNivo(nivo) };
}

/**
 * 🔴 Pokroviteljstvo ide po ISTOJ tabeli kao donacija fizičkog lica (čl. 10, set
 * 4.6.8, odluka vlasnika 2026-10-17). Uvećanje od 20% je ukinuto: premija po
 * pravnom obliku davaoca nagrađivala je jeftiniji put (donacija firme vlasnika
 * lično košta manje od lične donacije, priznat rashod ili ne), ubrzavala je
 * osnivački kanal i prelazila u glas preko ZRNA. Obrazloženje „odricanjem" nije
 * izdržalo poređenje sa fizičkim licem, koje takođe daje iz oporezovanog novca.
 *
 * Nivo se vodi POSEBNO po davaocu — firma po PIB-u (`Pokrovitelj.rsdKumulativ`),
 * čovek po svom nalogu — i dva zbira se ne sabiraju. Deljenje davanja na dva
 * zbira ne donosi više POEN-a nego jedan zbir (lestvica raste sa kumulativom).
 *
 * Numeracija nivoa je ista kao kod donacija (10.000 RSD = nivo 3). Zatečeni
 * `Pokrovitelj.trenutniNivo` iz pomerene numeracije prevodi migracija
 * `20261017120000_pokrovitelj_nivo_jedinstvena_tabela`.
 */
export function nivoPokroviteljstvaZaKumulativ(kumulativRSD: number): {
  nivo: number;
  kurs: number;
} {
  return nivoZaKumulativ(kumulativRSD);
}

/**
 * Redovi tabele iz čl. 4 za ekran pokroviteljstva — ISTI redovi kao za donaciju
 * fizičkog lica (čl. 10, set 4.6.8; odluka vlasnika 18.10.2026). Do tada je tabela
 * počinjala od nivoa 3 (najmanja prijava), pa je na ekranu izgledala kao zasebna
 * lestvica. Najmanja prijava (10.000 RSD) stoji u napomeni ispod tabele.
 */
export function tabelaPokroviteljstvaZaPrikaz(
  doNivoa = 14
): { nivo: number; do: number; kurs: number }[] {
  return tabelaZaPrikaz(doNivoa);
}

/**
 * Redovi za prikaz — zaključanih jedanaest plus nekoliko iz nastavka, da se na
 * ekranu vidi da tabela ne staje. Prikaz, ne pravilo: obračun ide kroz
 * `nivoZaKumulativ`, koji nema gornju granicu.
 */
export function tabelaZaPrikaz(doNivoa = 14): { nivo: number; do: number; kurs: number }[] {
  return Array.from({ length: doNivoa }, (_, i) => ({
    nivo: i + 1,
    do: pragZaNivo(i + 1),
    kurs: koeficijentZaNivo(i + 1),
  }));
}

/**
 * Izračunava POEN za novu donaciju po koeficijentnom modelu (čl. 4):
 * koeficijent novodostignutog nivoa (na osnovu novog kumulativa) primenjuje se
 * na celu novu donaciju. Zaokruživanje: Math.round() (POEN je ceo broj).
 */
export function izracunajPoenZaDonaciju(
  dosadaRSD: number,
  novaRSD: number
): { noviKumulativ: number; noviNivo: number; kurs: number; poen: number } {
  const noviKumulativ = dosadaRSD + novaRSD;
  const { nivo, kurs } = nivoZaKumulativ(noviKumulativ);
  const poen = Math.round(novaRSD * kurs);
  return { noviKumulativ, noviNivo: nivo, kurs, poen };
}
