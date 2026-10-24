/**
 * Pristanak na ne-neophodne (analitičke) kolačiće.
 *
 * Neophodni kolačići (sesija, prijava, bezbednost) NE prolaze kroz ovaj mehanizam
 * — oni su nužni za rad platforme i nisu podložni pristanku (Politika privatnosti
 * čl. 7). Ovde se uslovljava SAMO učitavanje analitike trećih lica
 * (Google Analytics) — vidi `Analitika.tsx`.
 *
 * ─── Zašto kolačić, a ne `localStorage` (R-06, 14.09.2026) ──────────────────
 *
 * Do seta 4.6.3 je odluka živela u `localStorage`. Dva kvara, oba činjenična:
 *
 *  1. `localStorage` NIKAD ne stiže do servera. Server tako nije znao odluku ni
 *     kad renderuje stranicu, pa se ni u jednom trenutku nije moglo pokazati da
 *     mehanizam radi kako tvrdimo.
 *  2. Odluka se gubila pri svakom čišćenju keša, pa se banner vraćao čoveku koji
 *     je već odlučio — a dokaza da je odlučio nije bilo nikad.
 *
 * Kolačić ide uz svaki zahtev i nosi TRI stvari: odluku, trenutak i VERZIJU teksta
 * po kome je odluka doneta.
 *
 * 🔴 Verzija je nosiva, ne ukras: kad se tekst bannera ili sam alat promeni, verzija
 * se podigne i oni koji su odlučivali po starom tekstu pitaju se ponovo. Bez toga
 * „pristao je" prestaje da znači išta posle prve izmene.
 *
 * ─── 🔴 Granica: nijedan nov podatak o posetiocu ────────────────────────────
 *
 * Za NEPRIJAVLJENOG posetioca ne pravi se nikakav identifikator i ne vodi se
 * serverski zapis po licu. To bi značilo prikupljanje novog podatka o njemu radi
 * dokazivanja pristanka na obradu — kružno, i suprotno čl. 3 Politike, gde
 * minimizacija stoji kao „strukturni princip koji se ne može ukinuti nijednom
 * upravljačkom odlukom". Za njega dokaz nosi sam mehanizam: ništa se ne učitava
 * pre odluke, odbijanje je jednako lako kao prihvatanje, a verzija teksta je
 * zabeležena u kodu.
 *
 * Za PRIJAVLJENOG korisnika odluka se veže za nalog (`ZapisPristanka` vrste
 * `KOLACICI_ANALITIKA`) — bez ijednog novog podatka, jer nalog već postoji.
 */
import { VERZIJA_PRISTANKA_KOLACICI } from "./verzije-akata";

/** Ime kolačića. Zadržava staro ime ključa radi prepoznatljivosti u alatima. */
export const CONSENT_KEY = "kolo-kolacici-pristanak";
export const CONSENT_EVENT = "kolo-kolacici-pristanak-promena";
/** Ponovo otvara banner — link „Podešavanja kolačića" u futeru. */
export const OTVORI_PODESAVANJA_EVENT = "kolo-kolacici-otvori";

/** Koliko kolačić sa odlukom važi — godinu dana, pa se odluka periodično obnavlja. */
const TRAJANJE_DANA = 365;

export type Pristanak = "prihvaceno" | "odbijeno";

export type Odluka = {
  pristanak: Pristanak;
  /** Verzija teksta po kojoj je odluka doneta. */
  verzija: string;
  /** ISO trenutak odluke. */
  kada: string;
};

function citajKolacic(ime: string): string | null {
  if (typeof document === "undefined") return null;
  const deo = document.cookie.split("; ").find((c) => c.startsWith(`${ime}=`));
  return deo ? decodeURIComponent(deo.slice(ime.length + 1)) : null;
}

/**
 * Odluka iz kolačića, ili `null` ako je nema.
 *
 * 🔴 Odluka doneta po STAROJ verziji teksta vraća `null` — čovek se pita ponovo.
 * To je ceo smisao verzije; bez ovoga bi se stara odluka tiho protegla na nešto
 * na šta niko nije pristao.
 */
export function procitajOdluku(): Odluka | null {
  const sirovo = citajKolacic(CONSENT_KEY);
  if (!sirovo) return null;
  try {
    const o = JSON.parse(sirovo) as Partial<Odluka>;
    if (o.pristanak !== "prihvaceno" && o.pristanak !== "odbijeno") return null;
    if (o.verzija !== VERZIJA_PRISTANKA_KOLACICI) return null;
    return { pristanak: o.pristanak, verzija: o.verzija, kada: o.kada ?? "" };
  } catch {
    return null;
  }
}

/** Trenutni pristanak; `null` ako korisnik još nije odlučio po važećoj verziji. */
export function procitajPristanak(): Pristanak | null {
  return procitajOdluku()?.pristanak ?? null;
}

/**
 * Sačuvaj odluku i obavesti slušaoce (Analitika) da reaguju odmah.
 *
 * `SameSite=Lax` i bez `Secure` u razvoju — kolačić ne nosi nijedan lični podatak,
 * samo odluku, verziju i trenutak.
 */
export function sacuvajPristanak(p: Pristanak): void {
  if (typeof document === "undefined") return;
  const odluka: Odluka = {
    pristanak: p,
    verzija: VERZIJA_PRISTANKA_KOLACICI,
    kada: new Date().toISOString(),
  };
  const istice = new Date(Date.now() + TRAJANJE_DANA * 24 * 60 * 60 * 1000).toUTCString();
  const bezbedno = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_KEY}=${encodeURIComponent(JSON.stringify(odluka))}` +
    `; Path=/; Expires=${istice}; SameSite=Lax${bezbedno}`;
  window.dispatchEvent(new CustomEvent<Pristanak>(CONSENT_EVENT, { detail: p }));
}

/**
 * Otvara banner i kad je odluka već doneta.
 *
 * 🔴 Politika čl. 7 obećava da se pristanak „može povući u svakom trenutku kroz
 * podešavanja kolačića", a ZZPL čl. 15 st. 3 traži da povlačenje bude jednako
 * lako kao davanje. Do 26.09.2026 banner se posle prve odluke više nije
 * pojavljivao, pa povlačenja faktički nije bilo. Link u oba futera ga vraća.
 */
export function otvoriPodesavanjaKolacica(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OTVORI_PODESAVANJA_EVENT));
}
