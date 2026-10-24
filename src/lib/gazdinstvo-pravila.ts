/**
 * Čista pravila gazdinstava — Pravilnik o KOLO sistemu čl. 40c i Pravilnik o
 * gazdinstvima (set 4.8.2). Bez Prisme: uvozi ih i pretraživač.
 *
 * 🔴 Gazdinstvo NIJE korisnik ni kolektivni oblik i nema zapis u Protokolu.
 * Doprinos se beleži u lični zapis člana pri odobrenju gazdinstva (odnosno
 * pristupanja), a evidentira se tek kad član ima objavljen oglas kojim nešto nudi
 * i kad je VERIFIKOVAN u lancu potvrda (čl. 40c st. 4; gazd. čl. 8 st. 2). Iznosi
 * se čitaju odavde — ne prepisivati ih u ekrane.
 *
 * 🔴 Prava po statusu (gazd. čl. 4a, 7, 7a, 9, 9a): ko sme da prijavi, kada
 * gazdinstvo sme imati članove, ko upravlja i ko poziva — sve se IZVODI iz
 * statusa učesnika (`status-ucesnika-pravila.ts`) i `smeClanoveOd`, ne čuva se.
 */
import {
  jeDete,
  jePotvrdjen,
  type StatusUcesnika,
} from "@/lib/status-ucesnika-pravila";

export type Provera = { ok: true } | { ok: false; razlog: string; status: 400 | 403 };

/** Čl. 40c st. 3 — prvi član po redu. */
export const IZNOS_PRVOG_CLANA = 5000;
/** Čl. 40c st. 3 — drugi do šestog člana. */
export const IZNOS_OSTALIH_CLANOVA = 2000;
/** Doprinos se beleži najviše šestorici članova jednog gazdinstva. */
export const MAX_CLANOVA_SA_DOPRINOSOM = 6;
/** Pravilnik o gazdinstvima čl. 4 t. 7 — uslov za gazdinstvo kao celinu. */
export const MIN_OGLASA_UZ_PRIJAVU = 3;

export const MAX_NAZIV = 80;
export const MAX_ADRESA = 120;
export const MAX_OPIS = 2000;
export const MIN_OPIS = 10;

/** Iznos doprinosa po redu u gazdinstvu (1 = prvi). Van reda (7. i dalje) — 0. */
export function iznosZaRedniBroj(redniBroj: number): number {
  if (!Number.isInteger(redniBroj) || redniBroj < 1) return 0;
  if (redniBroj === 1) return IZNOS_PRVOG_CLANA;
  if (redniBroj <= MAX_CLANOVA_SA_DOPRINOSOM) return IZNOS_OSTALIH_CLANOVA;
  return 0;
}

/** Zbir doprinosa gazdinstva sa `n` članova (5.000 / 9.000 / 15.000 …). */
export function ukupnoZaBrojClanova(n: number): number {
  let zbir = 0;
  for (let i = 1; i <= n; i++) zbir += iznosZaRedniBroj(i);
  return zbir;
}

export type KandidatClan = {
  maloletan: boolean;
  status: string;
  deaktiviran: boolean;
};

/**
 * Pravilnik o gazdinstvima čl. 7 st. 1 i Pravilnik o učešću dece čl. 15 — član
 * gazdinstva može biti isključivo punoletan nalog. Potvrđenost NIJE uslov za
 * pristupanje; ona je uslov za evidentiranje doprinosa (čl. 40c st. 4).
 */
export function smeBitiClan(k: KandidatClan): Provera {
  if (k.maloletan) {
    return { ok: false, razlog: "Maloletan korisnik ne može biti član gazdinstva.", status: 403 };
  }
  if (k.status !== "ACTIVE" || k.deaktiviran) {
    return { ok: false, razlog: "Nalog nije aktivan.", status: 400 };
  }
  return { ok: true };
}

export type UslovEvidentiranja = {
  /**
   * Verifikovan u lancu potvrda (član bez potvrde, član Kola, čuvar, osnivač) —
   * Pravilnik čl. 40c st. 4; gazd. čl. 8 st. 2 t. 2. Potvrđenost NIJE uslov.
   */
  verifikovan: boolean;
  /** Ima objavljen oglas kojim nudi dobro ili uslugu, uz sadržinski minimum. */
  imaOglas: boolean;
  maloletan: boolean;
  aktivan: boolean;
};

/** Čl. 40c st. 4 — oba uslova, za sve članove podjednako. */
export function smeSeEvidentirati(u: UslovEvidentiranja): boolean {
  return u.verifikovan && u.imaOglas && !u.maloletan && u.aktivan;
}

/**
 * Oznaka DOMAĆE (čl. 10) se ne čuva — izvodi se: gazdinstvo je odobreno i
 * oglašivač je i dalje njegov odobren član. Zato ne preživljava ni poništenje
 * odobrenja ni istupanje.
 */
export function jeDomace(oglas: {
  sellerId: string;
  gazdinstvo: { status: string; clanovi: { userId: string }[] } | null;
}): boolean {
  const g = oglas.gazdinstvo;
  if (!g || g.status !== "ODOBRENO") return false;
  return g.clanovi.some((c) => c.userId === oglas.sellerId);
}

/** Granice Srbije (sa malim pojasom) — tačka van njih je greška unosa. */
export function lokacijaUSrbiji(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= 41.8 && lat <= 46.3 && lng >= 18.7 && lng <= 23.1
  );
}

/** BPG je neobavezan; ako je naveden, sastoji se od cifara. */
export function ocistiBpg(unos: unknown): string | null {
  if (typeof unos !== "string") return null;
  const s = unos.replace(/\s+/g, "");
  if (!s) return null;
  return /^\d{6,15}$/.test(s) ? s : "";
}

export type UnosPrijave = {
  naziv: string;
  opis: string;
  bpg: string | null;
  neregistrovano: boolean;
  /** Adresa gazdinstva (čl. 4 t. 3) — obavezna, ne prikazuje se drugim korisnicima. */
  adresa: string;
  lat: number;
  lng: number;
  uloga: "NOSILAC" | "CLAN";
};

/** Čl. 4 — provera polja prijave (naselje proverava `razresiNaselje`, van ovog fajla). */
export function proveriPrijavu(u: UnosPrijave): Provera {
  const naziv = u.naziv.trim();
  if (naziv.length < 2) return { ok: false, razlog: "Naziv gazdinstva je obavezan.", status: 400 };
  if (naziv.length > MAX_NAZIV)
    return { ok: false, razlog: `Naziv može imati najviše ${MAX_NAZIV} znakova.`, status: 400 };
  const opis = u.opis.trim();
  if (opis.length < MIN_OPIS)
    return { ok: false, razlog: "Opiši šta i kako proizvodiš.", status: 400 };
  if (opis.length > MAX_OPIS)
    return { ok: false, razlog: `Opis može imati najviše ${MAX_OPIS} znakova.`, status: 400 };
  if (u.bpg === "") return { ok: false, razlog: "BPG se sastoji samo od cifara.", status: 400 };
  if (!u.neregistrovano && !u.bpg)
    return { ok: false, razlog: "Upiši BPG ili označi da gazdinstvo nije registrovano.", status: 400 };
  const adresa = u.adresa.trim();
  if (adresa.length < 3) return { ok: false, razlog: "Upiši adresu gazdinstva.", status: 400 };
  if (adresa.length > MAX_ADRESA)
    return { ok: false, razlog: `Adresa može imati najviše ${MAX_ADRESA} znakova.`, status: 400 };
  if (!lokacijaUSrbiji(u.lat, u.lng))
    return { ok: false, razlog: "Označi lokaciju gazdinstva na mapi.", status: 400 };
  if (u.uloga !== "NOSILAC" && u.uloga !== "CLAN")
    return { ok: false, razlog: "Izaberi svoju ulogu u gazdinstvu.", status: 400 };
  return { ok: true };
}

/**
 * Tekst izjave o tačnosti (čl. 4 t. 6 i čl. 7 st. 2). Snima se uz članstvo u
 * trenutku davanja i posle se ne generiše ponovo (CLAUDE.md pravilo 11).
 */
export function tekstIzjave(naziv: string): string {
  return (
    `Izjavljujem da su podaci o gazdinstvu „${naziv}“ tačni, da gazdinstvo postoji ` +
    `i proizvodi ono što je navedeno i da na njemu radim. Znam da se, ako izjava nije ` +
    `tačna, odobrenje gazdinstva poništava, doprinos gazdinstva otpisuje, a svi ` +
    `članovi isključuju iz sistema (Pravilnik o gazdinstvima čl. 12).`
  );
}

// ─── Prava po statusu (set 4.8.3) ────────────────────────────────────────────

const AKTIVNO_CLANSTVO_STATUSI = ["PRISTUPIO", "ODOBREN"];

/** Korisnik ili član bez potvrde — prijavljuje samo kao nosilac, bez članova (čl. 4a t. 2–3). */
const jeNepotvrdjenOdrasli = (s: StatusUcesnika) => s === "KORISNIK" || s === "CLAN_BEZ_POTVRDE";

export const PORUKA_PRIJAVA_DETE = "Maloletni učesnik ne može prijaviti gazdinstvo.";
export const PORUKA_PRIJAVA_SAMO_NOSILAC =
  "Dok te ne potvrdi član Kola, gazdinstvo možeš da prijaviš samo kao nosilac. Kao član gazdinstva prijavu podnosi član Kola.";

/**
 * Ko može prijaviti gazdinstvo (gazd. čl. 4a; set 4.8.3) — upisano ili neupisano u
 * Registar, svejedno:
 *  1) član Kola, čuvar i osnivač — kao nosilac ili kao član;
 *  2) član bez potvrde i korisnik — samo kao NOSILAC (članove gazdinstvo dobija kad
 *     podnosilac bude potvrđen, `smeClanoveOd`);
 *  3) maloletni učesnik — ne može.
 */
export function smePrijaviti(u: {
  status: StatusUcesnika;
  registrovano: boolean;
  uloga: "NOSILAC" | "CLAN";
}): Provera {
  if (jeDete(u.status)) return { ok: false, razlog: PORUKA_PRIJAVA_DETE, status: 403 };
  if (jePotvrdjen(u.status)) return { ok: true };
  if (u.uloga === "NOSILAC") return { ok: true };
  return { ok: false, razlog: PORUKA_PRIJAVA_SAMO_NOSILAC, status: 403 };
}

/**
 * 🔴 Izvod iz Registra se od seta 4.8.3 ne prilaže (gazd. čl. 4b st. 1). Funkcija
 * ostaje da bi svaki prikaz i ruta pitali isto mesto; zatečeni izvodi se i dalje
 * brišu odlukom o prijavi.
 */
export function trebaIzvod(_status: StatusUcesnika, _registrovano: boolean): boolean {
  return false;
}

/** Najveći izvod koji se prima (gazd. čl. 4b; specifikacija 4.8.2). */
export const MAX_IZVOD_BAJTOVA = 5 * 1024 * 1024;
/** Tipovi izvoda: PDF ili slika. */
export const TIPOVI_IZVODA = ["application/pdf", "image/jpeg", "image/png"] as const;

/**
 * Tip izvoda iz prvih bajtova (ne veruje se zaglavlju koje šalje pretraživač).
 * `null` kad fajl nije PDF, JPG ni PNG.
 */
export function tipIzvoda(bajtovi: Uint8Array): (typeof TIPOVI_IZVODA)[number] | null {
  const b = bajtovi;
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  return null;
}

/** Provera otpremljenog izvoda (gazd. čl. 4b). */
export function proveriIzvod(bajtovi: Uint8Array): Provera {
  if (bajtovi.length === 0) return { ok: false, razlog: "Fajl je prazan.", status: 400 };
  if (bajtovi.length > MAX_IZVOD_BAJTOVA)
    return { ok: false, razlog: "Izvod može imati najviše 5 MB.", status: 400 };
  if (!tipIzvoda(bajtovi)) return { ok: false, razlog: "Izvod mora biti PDF, JPG ili PNG.", status: 400 };
  return { ok: true };
}

/**
 * Gazdinstvo sme imati članove od trenutka kada je podnosilac bio član Kola,
 * odnosno osnivač (gazd. čl. 4a). 🔴 Monotono: pad potvrđenosti podnosioca ga ne
 * vraća (čl. 9a — gazdinstvo nastavlja da radi).
 */
export function smeImatiClanove(g: { smeClanoveOd: Date | string | null }): boolean {
  return g.smeClanoveOd !== null;
}

/**
 * Upravljanje gazdinstvom na platformi (oglasi u ime gazdinstva, profil) — gazd.
 * čl. 9 st. 1 i 9a:
 *  - svaki član gazdinstva koji je član Kola, čuvar ili osnivač;
 *  - podnosilac koji je korisnik ili član bez potvrde, dok gazdinstvo radi po
 *    čl. 4a t. 2–3 (bez članova). 🔴 Kad je gazdinstvo jednom smelo da ima
 *    članove, podnosilac kome je prestala potvrđenost gubi pravo (čl. 9a), isto
 *    kao svaki drugi član.
 */
export function smeUpravljati(u: {
  clanStatus: string;
  jePodnosilac: boolean;
  statusUcesnika: StatusUcesnika;
  smeClanove: boolean;
}): boolean {
  if (!AKTIVNO_CLANSTVO_STATUSI.includes(u.clanStatus)) return false;
  if (jePotvrdjen(u.statusUcesnika)) return true;
  return u.jePodnosilac && !u.smeClanove && jeNepotvrdjenOdrasli(u.statusUcesnika);
}

/**
 * Poziv u gazdinstvo (gazd. čl. 7 st. 2, 9 st. 1, 9a): poziva član gazdinstva
 * koji je član Kola, čuvar ili osnivač, i to samo kad gazdinstvo sme imati članove.
 */
export function smePozvati(u: { clanStatus: string; statusUcesnika: StatusUcesnika; smeClanove: boolean }): boolean {
  return AKTIVNO_CLANSTVO_STATUSI.includes(u.clanStatus) && jePotvrdjen(u.statusUcesnika) && u.smeClanove;
}

/**
 * Uslov pristupanja (gazd. čl. 7a): pozvani je u trenutku odobrenja član Kola,
 * čuvar ili osnivač. Korisnika, odnosno člana bez potvrde, pre toga potvrdi član
 * koji ga lično zna — potvrda ide kroz lanac potvrda, ne kroz gazdinstvo.
 */
export function pristupanjeSmeOdobriti(pozvaniStatus: StatusUcesnika): boolean {
  return jePotvrdjen(pozvaniStatus);
}

export type OsnovPrestanka = "BEZ_CLANOVA" | "BRISANJE" | "LAZNA_IZJAVA";

/**
 * Ko trpi poništenje i otpis pri prestanku gazdinstva (gazd. čl. 12, 12a st. 3;
 * Pravilnik čl. 40c st. 6):
 *  - BEZ_CLANOVA i BRISANJE (čl. 12a st. 1 t. 1–2): lica koja su članovi u
 *    trenutku prestanka; doprinos ranije istupelih se ne dira (čl. 9 st. 3);
 *  - LAZNA_IZJAVA (t. 3): i svako ko je ikad pristupio, i kada je u međuvremenu
 *    istupio (čl. 12 st. 2).
 * Pozvani koji nije pristupio i odbijeno pristupanje nisu bili članovi.
 */
export function clanoviZaOtpis(
  osnov: OsnovPrestanka,
  clanstva: { userId: string; status: string }[],
): string[] {
  const statusi = osnov === "LAZNA_IZJAVA" ? [...AKTIVNO_CLANSTVO_STATUSI, "ISTUPIO"] : AKTIVNO_CLANSTVO_STATUSI;
  return [...new Set(clanstva.filter((c) => statusi.includes(c.status)).map((c) => c.userId))];
}

/** Rok za odgovor na upit o preuzimanju izjave (gazd. čl. 9 st. 3). */
export const ROK_UPITA_DANA = 30;
