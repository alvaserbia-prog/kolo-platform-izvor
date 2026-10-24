/**
 * Levak — gde ljudi otpadaju na putu od registracije do objavljenog oglasa.
 *
 * Grupisanje je po PERIODU REGISTRACIJE (kohorta): pomerajući prozor poslednjih
 * 7 i 30 dana, pojedinačne nedelje i pojedinačni meseci, uz zbirno „ukupno".
 * Koraci se broje kao „da li je taj čovek to IKAD uradio", ne „da li je uradio
 * u tom periodu". Zato brojevi u redu jedne nedelje mogu da rastu i kasnije:
 * neko ko se registrovao u julu a oglas postavio u avgustu i dalje se broji u
 * julskoj kohorti. To je i poenta — pratimo sudbinu ljudi, ne nedeljni promet.
 *
 * Iz istog razloga se redovi jednog perioda NE sabiraju u red dužeg: mesec nije
 * zbir svojih nedelja po koracima jer isti čovek u obe kohorte ne ulazi, ali
 * njegov korak može da padne u drugi period od registracije.
 *
 * Sve funkcije ovde su čiste (bez baze), da bi se mogle testirati.
 */

/**
 * Redosled koraka levka. Prolaz svakog koraka se računa u odnosu na prethodni.
 *
 * Otkad je tabla jemstva ukinuta (Pravilnik 4.1.1 čl. 32 st. 4), put je obrnut u
 * odnosu na raniji: čovek prvo objavi ponudu, pa ga tek onda neko prepozna i
 * verifikuje. Zato „verifikovani" sada stoji POSLE „objavili_oglas", a koraka
 * „objavili_karticu" više nema — kartice prepoznavanja nema.
 */
export const KORACI = [
  "registrovani",
  "otvorili_poverenje", // posetio /verifikacija
  "otvorili_formu", // posetio /pijaca/novi-oglas
  "objavili_oglas",
  "verifikovani",
] as const;

export type Korak = (typeof KORACI)[number];

export interface KorisnikRed {
  id: string;
  createdAt: Date;
  /** null = nije verifikovan */
  verifiedAt: Date | null;
}

export interface LevakUlaz {
  korisnici: KorisnikRed[];
  /** userId koji su ikad otvorili /verifikacija */
  otvoriliPoverenje: Set<string>;
  /** userId koji su ikad otvorili /pijaca/novi-oglas */
  otvoriliFormu: Set<string>;
  /** userId → datum prvog objavljenog oglasa */
  prviOglas: Map<string, Date>;
}

export interface LevakKorak {
  korak: Korak;
  broj: number;
  /** Udeo u odnosu na PRETHODNI korak, 0–100. null za prvi korak. */
  prolaz: number | null;
  /**
   * Udeo u odnosu na REGISTROVANE, 0–100 (null kad nema registrovanih). Ovo se
   * prikazuje: koraci nisu strogo ulančani, pa `prolaz` ume da pređe 100% i
   * na ekranu se čitao kao greška alata.
   */
  udeo: number | null;
}

export interface LevakGrupa {
  /**
   * Ključ perioda:
   *  - `ukupno` — svi korisnici,
   *  - `nedelja` / `mesec` — POMERAJUĆI prozor od 7, odnosno 30 dana do sada,
   *  - `n:YYYY-MM-DD` — pojedinačna nedelja registracije (ponedeljak, UTC),
   *  - `m:YYYY-MM` — pojedinačan mesec registracije (UTC).
   */
  oznaka: string;
  koraci: LevakKorak[];
  /** Prosečan broj dana od registracije do verifikacije (samo verifikovani). */
  danaDoVerifikacije: number | null;
  /** Prosečan broj dana od verifikacije do prvog oglasa. */
  danaDoPrvogOglasa: number | null;
}

const DAN_MS = 24 * 60 * 60 * 1000;

/** Ponedeljak (UTC) nedelje u kojoj je dati datum, kao "YYYY-MM-DD". */
export function pocetakNedelje(d: Date): string {
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // getUTCDay: 0 = nedelja → pomeramo na ponedeljak kao prvi dan
  const pomak = (u.getUTCDay() + 6) % 7;
  u.setUTCDate(u.getUTCDate() - pomak);
  return u.toISOString().slice(0, 10);
}

/** Mesec (UTC) u kome je dati datum, kao "YYYY-MM". */
export function pocetakMeseca(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function prosek(vrednosti: number[]): number | null {
  if (vrednosti.length === 0) return null;
  const zbir = vrednosti.reduce((a, b) => a + b, 0);
  return Math.round((zbir / vrednosti.length) * 10) / 10;
}

/** Koraci levka za dati skup korisnika. */
function koraciZa(korisnici: KorisnikRed[], ulaz: LevakUlaz): LevakKorak[] {
  const brojevi: Record<Korak, number> = {
    registrovani: korisnici.length,
    otvorili_poverenje: 0,
    otvorili_formu: 0,
    objavili_oglas: 0,
    verifikovani: 0,
  };

  for (const k of korisnici) {
    if (ulaz.otvoriliPoverenje.has(k.id)) brojevi.otvorili_poverenje++;
    if (ulaz.otvoriliFormu.has(k.id)) brojevi.otvorili_formu++;
    if (ulaz.prviOglas.has(k.id)) brojevi.objavili_oglas++;
    if (k.verifiedAt) brojevi.verifikovani++;
  }

  return KORACI.map((korak, i) => {
    const broj = brojevi[korak];
    const udeo = korisnici.length === 0 ? null : Math.round((broj / korisnici.length) * 100);
    if (i === 0) return { korak, broj, prolaz: null, udeo };
    const prethodni = brojevi[KORACI[i - 1]];
    return {
      korak,
      broj,
      udeo,
      // Prolaz preko 100% je moguć i nije greška: koraci nisu strogo ulančani
      // (može se biti verifikovan bez objavljenog oglasa — jednokratnim kodom).
      prolaz: prethodni === 0 ? null : Math.round((broj / prethodni) * 100),
    };
  });
}

function vremenaZa(korisnici: KorisnikRed[], ulaz: LevakUlaz) {
  const doVerifikacije: number[] = [];
  const doOglasa: number[] = [];

  for (const k of korisnici) {
    if (!k.verifiedAt) continue;
    // Zatečeni nalozi (osnivači, seed) imaju potvrdu upisanu PRE datuma
    // registracije; negativan broj dana nije moguć i obarao je prosek ispod nule.
    const dana = (k.verifiedAt.getTime() - k.createdAt.getTime()) / DAN_MS;
    if (dana >= 0) doVerifikacije.push(dana);

    const oglas = ulaz.prviOglas.get(k.id);
    // Oglas pre verifikacije ne postoji (Pijaca je zaključana), ali ako se
    // pojavi zbog naknadne izmene podataka — ne uvlačimo negativan broj u prosek.
    if (oglas && oglas.getTime() >= k.verifiedAt.getTime()) {
      doOglasa.push((oglas.getTime() - k.verifiedAt.getTime()) / DAN_MS);
    }
  }

  return {
    danaDoVerifikacije: prosek(doVerifikacije),
    danaDoPrvogOglasa: prosek(doOglasa),
  };
}

function grupa(oznaka: string, ljudi: KorisnikRed[], ulaz: LevakUlaz): LevakGrupa {
  return { oznaka, koraci: koraciZa(ljudi, ulaz), ...vremenaZa(ljudi, ulaz) };
}

export interface LevakOpcije {
  /** Koliko pojedinačnih nedelja registracije se vraća (najnovije prve). */
  brojNedelja?: number;
  /** Koliko pojedinačnih meseci registracije se vraća (najnoviji prvi). */
  brojMeseci?: number;
  /** Trenutak od kog se mere pomerajući prozori. Ubacuje se radi testova. */
  sada?: Date;
}

/**
 * Levak po periodima registracije.
 *
 * Redosled je onaj u kome se periodi i prikazuju:
 * `ukupno`, pomerajuća `nedelja` i `mesec`, pa pojedinačne nedelje (najnovija
 * prva) i pojedinačni meseci (najnoviji prvi).
 *
 * 🔴 Pomerajući prozori NISU isto što poslednja kalendarska nedelja/mesec:
 * `nedelja` obuhvata registracije u poslednjih 7 dana, a `n:` red nedelju
 * koja počinje u ponedeljak. U ponedeljak ujutru se ta dva broja najviše
 * razilaze i to nije greška — jedan odgovara na „kako ide ovih dana", drugi
 * na „kakva je bila ta nedelja".
 *
 * `brojNedelja`/`brojMeseci` ograničavaju samo koliko se pojedinačnih perioda
 * vraća; `ukupno` uvek obuhvata SVE korisnike, i one starije od tog preseka.
 */
export function izracunajLevak(ulaz: LevakUlaz, opcije: LevakOpcije = {}): LevakGrupa[] {
  const { brojNedelja = 12, brojMeseci = 12, sada = new Date() } = opcije;

  const poNedelji = new Map<string, KorisnikRed[]>();
  const poMesecu = new Map<string, KorisnikRed[]>();
  const dodaj = (mapa: Map<string, KorisnikRed[]>, kljuc: string, k: KorisnikRed) => {
    const niz = mapa.get(kljuc);
    if (niz) niz.push(k);
    else mapa.set(kljuc, [k]);
  };

  const granicaNedelje = sada.getTime() - 7 * DAN_MS;
  const granicaMeseca = sada.getTime() - 30 * DAN_MS;
  const poslednjaNedelja: KorisnikRed[] = [];
  const poslednjiMesec: KorisnikRed[] = [];

  for (const k of ulaz.korisnici) {
    dodaj(poNedelji, pocetakNedelje(k.createdAt), k);
    dodaj(poMesecu, pocetakMeseca(k.createdAt), k);
    const t = k.createdAt.getTime();
    if (t >= granicaNedelje) poslednjaNedelja.push(k);
    if (t >= granicaMeseca) poslednjiMesec.push(k);
  }

  const nedelje = [...poNedelji.keys()].sort().reverse().slice(0, brojNedelja);
  const meseci = [...poMesecu.keys()].sort().reverse().slice(0, brojMeseci);

  return [
    grupa("ukupno", ulaz.korisnici, ulaz),
    grupa("nedelja", poslednjaNedelja, ulaz),
    grupa("mesec", poslednjiMesec, ulaz),
    ...nedelje.map((o) => grupa(`n:${o}`, poNedelji.get(o)!, ulaz)),
    ...meseci.map((o) => grupa(`m:${o}`, poMesecu.get(o)!, ulaz)),
  ];
}
