/**
 * Prijava neispunjene razmene — ČISTA pravila (bez Prisme).
 *
 * Fajl je bez ijednog `import`-a jer ga uvozi i klijentska komponenta u istoriji
 * POEN-a (dugme „Prijavi problem") i serverske rute — jedno mesto istine, isti
 * uslov na obe strane.
 *
 * Šta ovo jeste, a šta nije:
 *
 *  - Prepis POEN-a je ažuriranje evidencije između dva zapisa (Pravilnik čl. 14,
 *    16), a za samu razmenu dobara i usluga odgovaraju korisnici po opštim
 *    pravilima obligacionog prava; Fondacija i Protokol nisu strana u tom
 *    odnosu (Uslovi čl. 22). Zato prijava NIJE zahtev za povraćaj i ne obara
 *    prepis sama od sebe — ona je evidencija o kojoj Fondacija odlučuje.
 *  - Poništenje ide PROTIVZAPISOM, ne brisanjem: istorija se ne prepravlja, kao
 *    ni pri prestanku statusa (čl. 34).
 *
 * 🔴 POVRAĆAJ JE UVEK PUN — zapis primaoca sme u minus (odluka vlasnika,
 * 2026-08-15). Ranija verzija je vraćala najviše ono što na zapisu zatekne, pa
 * je onaj ko brže potroši tuđi POEN prolazio jeftinije od onog ko ga sačuva —
 * to je nagrađivalo upravo ponašanje zbog kog se prijava i podnosi. Minus radi
 * isto što i nadoknada iz čl. 20b: nije dug i ne naplaćuje se, POEN-i koji
 * pristignu prvo ga popunjavaju, a prepis drugome je moguć tek kad zapis pređe
 * nulu. Time izuzetaka od zabrane negativnog zapisa (Pravilnik čl. 14 st. 3)
 * ima DVA — vidi napomenu o aktima u CLAUDE.md.
 */

/** Najviše otvorenih prijava po korisniku — ista brana kao kod prigovora. */
export const MAX_OTVORENIH_PRIJAVA = 3;

/** Najkraći opis koji nešto govori Fondaciji. */
export const MIN_OPIS_PRIJAVE = 10;

export type UlazPrijave = {
  /** Tip transakcije — prijavljuje se samo prepis između dva korisnika. */
  tipTransakcije: string;
  /** Vlasnik zapisa sa kog je POEN skinut; `null` kad je davalac Protokol. */
  posiljaocId: string | null;
  /** Ko prijavljuje. */
  prijaviocId: string;
  /** Je li prijavilac maloletan — za njega poništenje prepisa ne važi (čl. 14 st. 5). */
  prijaviocMaloletan: boolean;
  /** Postoji li već prijava nad ovim prepisom. */
  vecPrijavljena: boolean;
  /** Koliko prijava ovog korisnika još čeka odluku. */
  otvorenihPrijava: number;
  opis: string;
};

export type IshodProvere = { ok: true } | { ok: false; razlog: string };

/**
 * Sme li se ovaj prepis prijaviti.
 *
 * Prijavljuje isključivo POŠILJALAC: on je jedini nešto izgubio. Primalac koji
 * nije dobio robu nije prepisao POEN, pa nema šta da mu se vrati; njegov put je
 * prijava oglasa (moderacija) ili prigovor.
 */
export function smePrijaviti(u: UlazPrijave): IshodProvere {
  if (u.tipTransakcije !== "TRANSFER")
    return { ok: false, razlog: "Prijavljuje se samo prepis POENA između dva člana." };

  if (!u.posiljaocId || u.posiljaocId !== u.prijaviocId)
    return { ok: false, razlog: "Prepis može da prijavi samo onaj ko je POEN prepisao." };

  // 🔴 Za maloletnog korisnika poništenje prepisa NE važi (Pravilnik o učešću dece,
  // čl. 14 st. 5). Odredba postoji od prve verzije akta, a kod je do 4.5.3 nije
  // sprovodio — dete je moglo da podnese prijavu i tuđem detetu obori prepis u minus.
  // Roditelj namerno NIJE ovlašćen umesto njega: pravo da se posao maloletnika obori
  // daje Porodični zakon i ostvaruje se između strana, ne dugmetom u Platformi.
  if (u.prijaviocMaloletan)
    return {
      ok: false,
      razlog:
        "Prepis maloletnog korisnika se ne poništava kroz Platformu. Ako razmena nije ispala kako je dogovoreno, dogovorite se sa drugom stranom.",
    };

  if (u.vecPrijavljena)
    return { ok: false, razlog: "Ovaj prepis je već prijavljen." };

  if (u.otvorenihPrijava >= MAX_OTVORENIH_PRIJAVA)
    return {
      ok: false,
      razlog: `Imaš ${MAX_OTVORENIH_PRIJAVA} prijave koje čekaju odluku. Sačekaj odgovor na njih.`,
    };

  if (u.opis.trim().length < MIN_OPIS_PRIJAVE)
    return {
      ok: false,
      razlog: `Opis mora imati najmanje ${MIN_OPIS_PRIJAVE} znakova — po njemu se odlučuje.`,
    };

  return { ok: true };
}

/**
 * Koliko se vraća — ceo prepisani iznos, bez obzira na stanje primaoca.
 *
 * Funkcija postoji i posle ukidanja kape, da bi mesto na kom se iznos određuje
 * ostalo jedno; ako se ikad uvede delimičan povraćaj, menja se samo ona.
 */
export function iznosPovracaja(iznosPrepisa: number): number {
  return Math.max(0, iznosPrepisa);
}

/** Stanje primaoca posle poništenja — ume da bude negativno. */
export function stanjePosle(stanjePrimaoca: number, iznosPrepisa: number): number {
  return stanjePrimaoca - iznosPovracaja(iznosPrepisa);
}

/**
 * Da li poništenje odvodi zapis primaoca u minus (nadoknada).
 *
 * Adminu se prikazuje PRE odluke, a primaocu se u obaveštenju objašnjava
 * drugačijim tekstom — minus menja šta čovek sme da radi sa zapisom, pa ne sme
 * da se pojavi bez reči.
 */
export function idUMinus(stanjePrimaoca: number, iznosPrepisa: number): boolean {
  return stanjePosle(stanjePrimaoca, iznosPrepisa) < 0;
}
