/**
 * Čista pravila osnivačkog doprinosa (Pravilnik o osnivačkom doprinosu; Pravilnik
 * o KOLO sistemu čl. 35). Bez Prisme — uvozi ih i server (`protokol/osnivacki.ts`
 * ih re-eksportuje) i test.
 *
 * - Gornja granica: 2.400.000 POEN-a = 100 koraka × 24.000 (čl. 4–5).
 * - Korak za svaki prag od 100.000 POEN-a koji ukupan broj prvi put dostigne,
 *   zaključno sa 10.000.000; provera na kraju obračunskog perioda (čl. 6).
 * - Raspodela srazmerno udelima iz odluke o raspodeli (čl. 8 st. 2); udeo osnivača
 *   kome je prestao status korisnika se ne evidentira i ne raspoređuje na druge,
 *   korak se za taj udeo umanjuje (čl. 8 st. 3).
 * - Udeli su dostupni svim korisnicima, pseudonim samo učesnicima (čl. 11 st. 2).
 */

export const ITERATION_LIMIT = 100;
export const KORAK_IZNOS = 24_000;
export const GORNJA_GRANICA = ITERATION_LIMIT * KORAK_IZNOS; // 2.400.000
export const PRAG_SKOK = 100_000;

type Udeo = { udeoBrojilac: number; udeoImenilac: number };

/**
 * Raspodela punog koraka (KORAK_IZNOS) među SVIM osnivačima iz odluke o raspodeli
 * srazmerno udelima (čl. 8 st. 2). Largest-remainder metoda — zbir vraćenih
 * iznosa je tačno KORAK_IZNOS (24.000), bez gubitka na zaokruživanju.
 * Pretpostavka (validirano u pozivaocu): svi udeli imaju isti imenilac, zbir
 * brojilaca = imenilac.
 */
export function raspodeliKorak(udeli: Udeo[]): number[] {
  if (udeli.length === 0) return [];
  const imenilac = udeli[0].udeoImenilac;
  const baze = udeli.map((u) => Math.floor((KORAK_IZNOS * u.udeoBrojilac) / imenilac));
  let ostatak = KORAK_IZNOS - baze.reduce((s, x) => s + x, 0);
  const ostaci = udeli
    .map((u, i) => ({ i, frac: (KORAK_IZNOS * u.udeoBrojilac) % imenilac }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < ostaci.length && ostatak > 0; k++) {
    baze[ostaci[k].i] += 1;
    ostatak--;
  }
  return baze;
}

/**
 * Iznosi jednog koraka po osnivaču (čl. 8 st. 2–3). Raspodela se računa nad
 * CELOM odlukom o raspodeli, pa se udeo osnivača kome je prestao status samo
 * izostavlja (nula): 🔴 ne raspoređuje se na druge osnivače, a korak se za taj
 * udeo umanjuje. Ponovno računanje nad „živima" bi njihov udeo uvećalo — to je
 * upravo ono što st. 3 zabranjuje.
 */
export function iznosiKoraka(osnivaci: (Udeo & { prestao: boolean })[]): number[] {
  return raspodeliKorak(osnivaci).map((iznos, i) => (osnivaci[i].prestao ? 0 : iznos));
}

/**
 * Da li je osnivaču prestao status za potrebe kanala (čl. 8 st. 3: „od tada se ne
 * evidentira"). Prestanak je trajan za kanal: ko je jednom izostao iz koraka zato što
 * mu je status prestao, ne vraća se ni kad bi mu se nalog kasnije vratio — inače bi
 * preskočeni koraci ostali nepokriveni, a kasniji ne. Izostanak se prepoznaje po tome
 * što osnivač ima manje upisanih udela nego što je kanal evidentirao koraka posle
 * zaključavanja liste.
 */
export function osnivacuJePrestaoStatus(args: {
  prestaoSada: boolean;
  brojEmisija?: number;
  brojKorakaKanala: number;
}): boolean {
  if (args.prestaoSada) return true;
  if (args.brojEmisija === undefined) return false;
  return args.brojEmisija < args.brojKorakaKanala;
}

/**
 * Preostali iznos do gornje granice (čl. 11 st. 1). Posle zatvaranja kanala (čl. 10)
 * ništa više ne može biti evidentirano, pa je preostalo nula i kad je kanal zbog
 * umanjenih koraka (čl. 8 st. 3) evidentirao manje od gornje granice.
 */
export function preostaloDoGranice(ukupnoEvidentirano: number, zatvoren: boolean): number {
  return zatvoren ? 0 : Math.max(0, GORNJA_GRANICA - ukupnoEvidentirano);
}

/**
 * Javnost udela (čl. 11 st. 2): gost vidi samo zbirne podatke kanala (st. 1),
 * svaki korisnik (svako sa nalogom) vidi udele iz odluke o raspodeli, a pseudonim
 * osnivača uz udeo vidi samo učesnik (Pravilnik čl. 56).
 */
export type VidljivostUdela = "NISTA" | "UDELI" | "UDELI_I_PSEUDONIM";

export function vidljivostUdela(v: { prijavljen: boolean; ucesnik: boolean }): VidljivostUdela {
  if (!v.prijavljen) return "NISTA";
  return v.ucesnik ? "UDELI_I_PSEUDONIM" : "UDELI";
}
