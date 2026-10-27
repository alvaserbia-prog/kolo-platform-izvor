/**
 * Pravila Modula Deca — ČISTE funkcije, bez baze.
 * Osnov: Pravilnik o učešću dece, Pravilnik o KOLO sistemu čl. 52.
 *
 * Set 4.8.2: tri stanja naloga (dete na čekanju / sa roditeljem / Kola), potvrda
 * postojanja deteta bez roka (čl. 6) i prijava lažnog roditeljstva (čl. 4e).
 * Brana: `__tests__/deca-stanja-izvor.test.ts`, `deca-potvrda-postojanja-izvor.test.ts`.
 *
 * Izdvojeno iz `src/lib/protokol/deca.ts` (koji radi sa Prismom) zato što ista
 * pravila treba i pretraživaču — obrascu za otvaranje naloga, prekidaču na profilu
 * deteta, ekranu deteta na čekanju i prikazu Pijace. Servisni modul ih re-eksportuje,
 * pa server ima jedan ulaz.
 *
 * ─── Načelo koje nosi ceo modul ─────────────────────────────────────────────
 *
 * Dete nema razloga da laže o uzrastu. Neverifikovan punoletni nalog ne dobija
 * upravljanje ni jemčenje dok ga neko ne potvrdi; dete koje bi se lažno predstavilo
 * kao odraslo tražilo bi potvrdu koju nikad neće dobiti.
 * 🟡 Od seta 4.8.1 nov punoletni član piše u Pričaonici i prvi piše oglašivaču, pa
 * lažno odrastao nalog više NIJE prazan — to je prihvaćen rizik odluke vlasnika
 * (20.10.2026), zapisan u DPIA.
 * Deklaracija „ja sam dete" vodi ka prijateljstvima i POEN-u. Sistem uzrast NE
 * proverava i ne mora — istina je jedini put ka onome što dete želi.
 *
 * 🔴 IZMENA U ODNOSU NA PRVU VERZIJU: u dečjem prostoru sada NASTAJU zapisi POEN-a
 * (500 po prijateljstvu, čl. 33). Ranija rečenica „u dečjem prostoru ne nastaje
 * nijedan nov zapis POEN-a" (čl. 14 st. 1 prve verzije) više NE važi. Posledica koju
 * treba znati: emisija iz dečjeg prostora ulazi u opticaj, pa pomera prag osnivačkog
 * koraka (na svakih 100.000 POEN) i obračunski koeficijent ZRNA — u OBA smera, jer
 * se pri raskidu i pri punoletstvu POEN otpisuje.
 */

import { smeNovRazgovor } from "./nov-clan-pravila";
import { potvrdjenIzPolja } from "./status-ucesnika-pravila";

/** Roditelj iz reda baze → položaj potreban modulu (čl. 5). Čisto, bez Prisme. */
export function roditeljStanjeIzPolja(r: {
  aktivan: boolean;
  zaustavljenaAt: Date | string | null;
  postojanjePotvrdjeno: boolean;
  roditelj: {
    maloletan?: boolean | null;
    jeOsnivac?: boolean | null;
    verified?: boolean | null;
    indeksStvarnosti?: number | null;
    potvrdjenAt?: Date | string | null;
  };
}): RoditeljStanje {
  return {
    aktivan: r.aktivan,
    potvrdjen: potvrdjenIzPolja(r.roditelj),
    postojanjePotvrdjeno: r.postojanjePotvrdjeno,
    zaustavljeno: r.zaustavljenaAt != null,
  };
}

/** Donja granica uzrasta za pristup modulu (čl. 2). */
export const UZRAST_MIN = 7;

/** Gornja granica — punoletstvom prestaje svojstvo maloletnog korisnika (čl. 2). */
export const UZRAST_PUNOLETSTVO = 18;

/**
 * Granica uzrasnih grupa (čl. 22): **7–14** i **15–17**.
 *
 * 🔴 Do ovog uzrasta maloletni korisnik sa punoletnima NITI razmenjuje NITI
 * komunicira, i saglasnost roditelja to ne otvara. Razlog je pravni, ne
 * bezbednosni: po članu 64 Porodičnog zakona dete koje nije navršilo četrnaest
 * godina preduzima samo poslove male vrednosti i poslove kojima pribavlja
 * isključivo prava, a od navršenih četrnaest sve ostalo uz saglasnost roditelja
 * — koja se daje za KONKRETAN posao, ne unapred za sve.
 *
 * 🔴 Razvrstavanje se odnosi ISKLJUČIVO na odnos sa punoletnim korisnicima.
 * Prijateljstva (čl. 32), Pričaonica (čl. 27) i razmena među decom se NE
 * razvrstavaju po uzrastu — inače bi se graf presekao i po čl. 35 otpisao POEN
 * evidentiran za prijateljstva koja bi time pala.
 */
export const UZRAST_SA_ODRASLIMA = 15;

/**
 * Prag iznad koga prepis iz zapisa maloletnog korisnika čeka odobrenje roditelja
 * (čl. 30 st. 3). Dva praga, jer „mala vrednost" nije ista za sedmogodišnjaka i za
 * sedamnaestogodišnjaka.
 */
export const PRAG_ODOBRENJA_MLADJI = 5_000;
export const PRAG_ODOBRENJA_STARIJI = 20_000;

/** Koliko dana roditelj ima da se izjasni o prepisu na čekanju (čl. 30 st. 4). */
export const ROK_ODOBRENJA_PREPISA_DANA = 7;

/** Prag za dati uzrast; nepoznat uzrast pada na stroži prag. */
export function pragOdobrenja(godine: number | null): number {
  return (godine ?? 0) >= UZRAST_SA_ODRASLIMA ? PRAG_ODOBRENJA_STARIJI : PRAG_ODOBRENJA_MLADJI;
}

/**
 * Da li maloletni korisnik uopšte sme u odnos sa punoletnim korisnicima (čl. 22).
 * Punoletni nalog uvek sme — ovo pravilo uređuje samo dečju stranu.
 */
export function smeSaOdraslima(u: Ucesnik): boolean {
  if (!u.maloletan) return true;
  return (u.godine ?? 0) >= UZRAST_SA_ODRASLIMA;
}

/**
 * Da li prepis traži odobrenje roditelja (čl. 30).
 *
 * 🔴 Samo ODLIV iz dečjeg zapisa. Priliv se ne odobrava: po članu 64 Porodičnog
 * zakona posao kojim maloletnik pribavlja isključivo prava preduzima sam.
 *
 * 🔴 Prepis između roditelja i njegovog deteta se NE odobrava — čl. 30 st. 1 ga
 * pušta bez ograničenja, a odobravanje sopstvenog poteza nema predmet.
 */
export function trebaOdobrenjeRoditelja(od: Ucesnik, ka: Ucesnik, iznos: number): boolean {
  if (!od.maloletan) return false;
  if (jeMojeDete(ka, od)) return false;
  return iznos >= pragOdobrenja(od.godine);
}

export const PORUKA_SAMO_SA_DECOM =
  "Do navršenih 15 godina razmena i razgovor idu samo sa drugom decom. Saglasnost roditelja to ne menja.";

/**
 * Potvrda postojanja deteta (čl. 13, set 4.8.2) NEMA rok. Postupak od šezdeset dana,
 * podsetnici i poništenje potvrde stvarnosti roditelja zbog neaktivnosti su ukinuti:
 * ako potvrda ne stigne, roditelju se ništa ne oduzima, a nalog deteta ostaje „dete
 * sa roditeljem" (čl. 13 st. 6). Brana: `__tests__/deca-potvrda-postojanja-izvor.test.ts`.
 */

/**
 * Koliko važi link iz poruke poslate roditelju (čl. 10 st. 3).
 *
 * Kraće od roka za brisanje namerno: link je jednokratan i putuje elektronskom
 * poštom, pa ne sme da leži upotrebljiv dve nedelje. Kad istekne, ostaje rezervni
 * put — šestocifreni kod iz profila deteta, koji važi do samog brisanja.
 */
export const ROK_TOKENA_DANA = 7;

/**
 * Koliko nalog deteta sme da postoji bez preuzimanja (čl. 10 st. 5).
 *
 * 🔴 Rok važi SAMO za preuzimanje naloga, ne i za drugi korak (da roditelj postane
 * član Kola i da mu postojanje deteta bude potvrđeno). Teče iznova od ukidanja veze
 * po prijavi lažnog roditeljstva kad dete ostane bez roditelja (čl. 18 st. 3). Razlog je pravni, ne tehnički: dete na čekanju je lice čiji se
 * podaci obrađuju PRE pribavljenog pristanka roditelja, i to ne sme da traje
 * neograničeno. Posle preuzimanja pristanak postoji, obrada je zakonita i ništa ne
 * visi — rok tu ne bi štitio ništa, samo bi ubijao naloge dece čiji roditelji nisu
 * bili spori nego bez veze u mreži.
 */
export const ROK_PREUZIMANJA_DANA = 14;

/**
 * Najmanja dužina lozinke naloga maloletnog korisnika.
 *
 * Isti prag kao za punoletne naloge (`/api/profil/lozinka`). Stoji ovde zato što
 * lozinku detetu zadaje i menja roditelj, pa isto pravilo treba i obrascu u
 * pretraživaču i ruti na serveru.
 */
export const MIN_LOZINKA = 8;

/** POEN po sklopljenom prijateljstvu, svakoj strani (čl. 33 st. 1). */
export const PRIJATELJSTVO_POEN = 500;

/** Koliko dana pre punoletstva ide najava o otpisu i zatvaranju prijateljstava (čl. 35 st. 5). */
export const NAJAVA_PUNOLETSTVA_DANA = 30;

/**
 * `status` razdvaja dve vrste odbijanja:
 *  - 400 — podatak nije ispravan (uzrast van opsega, prazan pseudonim);
 *  - 403 — radnja nije dozvoljena po pravilima modula.
 */
export type Provera = { ok: true } | { ok: false; razlog: string; status: 400 | 403 };

/**
 * Tri stanja naloga maloletnog učesnika (čl. 5, set 4.8.2). Identifikatori
 * vrednosti ostaju (CLAUDE.md pravilo 12); nazivi na ekranu su „dete na čekanju",
 * „dete sa roditeljem" i „dete Kola" (namespace `status`).
 *
 *  - `NA_CEKANJU` (dete na čekanju) — roditelj još nije preuzeo nalog. Profil i
 *    prijateljstva uživo; oglase vidi kao neprijavljen posetilac. Nema Pričaonicu,
 *    poruke, školu, oglase ni prepis.
 *  - `POVEZANO` (dete sa roditeljem) — roditelj je otvorio ili preuzeo nalog, ali
 *    nijedan roditelj nije član Kola niti osnivač kome je postojanje deteta
 *    potvrđeno. Pričaonica i poruke samo sa prijateljima, škola da; oglase vidi bez
 *    pseudonima oglašivača (osim prijatelja). Ne objavljuje i ne prepisuje — ni sa
 *    roditeljem; doprinos iz čl. 33 mu je samo zabeležen.
 *  - `AKTIVNO` (dete Kola) — bar jedan roditelj je član Kola ili osnivač, veza mu
 *    nije zaustavljena (čl. 17) i NJEMU je postojanje deteta potvrđeno (čl. 13).
 *
 * Otvaranje (čl. 7) i preuzimanje (čl. 11) vode u `POVEZANO`; u `AKTIVNO` nalog
 * prelazi sam, prema položaju roditelja i potvrdi postojanja (čl. 6 st. 1).
 */
export type StanjeDeteta = "NA_CEKANJU" | "POVEZANO" | "AKTIVNO";

/** Roditelj onako kako ga vidi ovaj modul — dovoljno da se odredi stanje deteta. */
export type RoditeljStanje = {
  /** Nalog roditelja radi (nije ugašen ni isključen). */
  aktivan: boolean;
  /** Član Kola ili osnivač (`potvrdjenIzPolja`). Član bez potvrde NIJE (čl. 5 st. 2). */
  potvrdjen: boolean;
  /** Ovom roditelju je postojanje deteta potvrđeno i potvrda nije poništena (čl. 13). */
  postojanjePotvrdjeno: boolean;
  /** Veza je privremeno zaustavljena po prijavi lažnog roditeljstva (čl. 17 st. 2). */
  zaustavljeno: boolean;
};

/**
 * Na šta nalog deteta čeka (čl. 5 st. 4) — prikazuje se na profilu deteta.
 * `null` kad je nalog dete Kola.
 *
 *  - `RODITELJ` — roditelj još nije preuzeo nalog;
 *  - `RODITELJ_U_KOLO` — nijedan roditelj (čija veza radi) nije član Kola ni osnivač;
 *  - `POTVRDA_POSTOJANJA` — roditelj jeste član Kola, ali mu postojanje deteta još
 *    nije potvrđeno.
 */
export type NaStaSeCeka = "RODITELJ" | "RODITELJ_U_KOLO" | "POTVRDA_POSTOJANJA";

export function naStaSeCeka(roditelji: RoditeljStanje[]): NaStaSeCeka | null {
  const stanje = stanjeDeteta(roditelji);
  if (stanje === "AKTIVNO") return null;
  if (stanje === "NA_CEKANJU") return "RODITELJ";
  const radni = roditelji.filter((r) => r.aktivan && !r.zaustavljeno);
  return radni.some((r) => r.potvrdjen) ? "POTVRDA_POSTOJANJA" : "RODITELJ_U_KOLO";
}

/**
 * Najmanji oblik korisnika iz koga se izvodi svaka odluka ovog modula.
 * Punoletan korisnik je onaj kome je `maloletan === false`.
 */
export type Ucesnik = {
  id: string;
  maloletan: boolean;
  /**
   * Uzrast u godinama; `null` kod punoletnog naloga i kod deteta kome roditelj
   * datum rođenja još nije upisao (nalog na čekanju po čl. 8).
   */
  godine: number | null;
  /** Prekidač iz čl. 20 st. 2. Kod punoletnog korisnika nema značenja. */
  dozvolaOdrasli: boolean;
  /**
   * Roditelji (najviše dva, ista ovlašćenja) ČIJA VEZA NIJE ZAUSTAVLJENA: dok je
   * veza zaustavljena po prijavi (čl. 17 st. 2), lice nema ni uvid ni ovlašćenja
   * roditelja. Kod punoletnog korisnika prazno.
   */
  roditeljIds: string[];
  /** Kod punoletnog korisnika uvek `AKTIVNO` — stanja se odnose samo na decu. */
  stanje: StanjeDeteta;
  /** Škola koju je dete samo izabralo (čl. 26 st. 1). `null` kod punoletnog naloga. */
  skolaSifra: string | null;
};

/**
 * Da li posmatrač sme da vidi SPISAK DECE jedne škole (čl. 26 st. 3).
 *
 * Dva uslova, oba nužna:
 *
 * 1. 🔴 **Punopravno dete, ne bilo koji maloletan nalog.** Do R-03 je uslov bio
 *    samo `maloletan`, a maloletan nalog se otvara za dva minuta — pseudonim,
 *    lozinka i TUĐ imejl — i `maloletan: true` se upisuje odmah, dakle i nalogu u
 *    stanju `NA_CEKANJU`, iza koga ne stoji niko. Odrastao je tako izlistavao
 *    decu sa slikama i iznosima. `AKTIVNO` (dete Kola) traži roditelja koji je
 *    član Kola i čije je roditeljstvo potvrdio član Kola koji ga lično zna
 *    (čl. 26 st. 3). Dete sa roditeljem spisak ne vidi.
 *
 * 2. 🔴 **Samo SVOJA škola.** Spisak je zajednica u kojoj se deca ionako znaju
 *    uživo; dete iz Vranja nema razlog da lista decu škole u Somboru. Bez ovog
 *    uslova jedan nalog vidi decu svih 1.888 škola.
 *
 * Nacionalne liste i svi brojevi ostaju svima — one pokreću ceo mehanizam i ne
 * imenuju nikoga.
 */
export function smeVidetiSpisakSkole(
  posmatrac: Ucesnik | null,
  sifra: string
): boolean {
  if (!posmatrac?.maloletan) return false;
  if (posmatrac.stanje !== "AKTIVNO") return false;
  return posmatrac.skolaSifra === sifra;
}

// ── Stanje naloga ─────────────────────────────────────────────────────────────

/**
 * Stanje naloga maloletnog učesnika po roditeljima koje ima (čl. 5, 6, 13, 17).
 *
 * 🔴 Dovoljan je JEDAN roditelj koji ispunjava SVA TRI uslova istovremeno: član je
 * Kola ili osnivač, veza mu nije zaustavljena, i NJEMU je postojanje deteta
 * potvrđeno. Potvrda data drugom roditelju ne prelazi na ovog (čl. 5 st. 1 t. 3).
 *
 * Zaustavljena veza (čl. 17 st. 2) i dalje drži nalog u stanju „dete sa roditeljem":
 * veza nije ukinuta, samo ne proizvodi dejstvo. „Dete na čekanju" je nalog bez
 * ijednog živog roditelja (ukinuta veza se briše, pa je i to ovaj slučaj).
 *
 * 🔴 Prisma prevod ovog uslova je `USLOV_AKTIVNO_DETE` u `protokol/skole.ts`.
 * Menjaju se zajedno.
 */
export function stanjeDeteta(roditelji: RoditeljStanje[]): StanjeDeteta {
  const zivi = roditelji.filter((r) => r.aktivan);
  if (zivi.length === 0) return "NA_CEKANJU";
  return zivi.some((r) => !r.zaustavljeno && r.potvrdjen && r.postojanjePotvrdjeno)
    ? "AKTIVNO"
    : "POVEZANO";
}

/** Objava oglasa (čl. 24 st. 1): samo dete Kola. */
export function smeObjavitiOglas(stanje: StanjeDeteta): boolean {
  return stanje === "AKTIVNO";
}

/**
 * Učešće u ažuriranju evidencije POEN-a (čl. 30 st. 6): samo dete Kola.
 * 🔴 Važi i za prepis između roditelja i deteta, u oba smera.
 */
export function smePrepis(stanje: StanjeDeteta): boolean {
  return stanje === "AKTIVNO";
}

/**
 * Da li nalog sme u Pričaonicu (čl. 27 st. 2).
 *
 * 🔴 Bezbednosno pravilo, ne kazna. Iza deteta koje je roditelj uveo stoji potvrđen
 * odrastao čovek i svi koji su njega potvrdili. Iza deteta na čekanju ne stoji
 * niko — registrovalo se za dva minuta sa bilo kojim imejlom, pa bi se odrastao
 * čovek tako predstavio kao dvanaestogodišnjak bez ijedne prepreke. Ranije je taj
 * rizik hvatalo roditeljsko čitanje razgovora; pošto roditelj više ne čita,
 * Pričaonica bi ostala bez ijedne provere.
 *
 * Ovo je i najjači pritisak koji sistem vrši: POEN je apstraktan sedmogodišnjaku,
 * a ne moći odgovoriti drugu koji ti je upravo skenirao kod — to je konkretno.
 */
export function smeUPricaonicu(stanje: StanjeDeteta): boolean {
  return stanje !== "NA_CEKANJU";
}

/**
 * Da li se nalogu upisuje POEN iz dečjih kanala (čl. 33 st. 2).
 * Prepis od roditelja i razmena sa drugom decom nisu upis — oni su zero-sum.
 */
export function poenSeUpisuje(stanje: StanjeDeteta): boolean {
  return stanje === "AKTIVNO";
}


/** Poruka detetu sa roditeljem koje pokušava ono što radi tek dete Kola. */
export const PORUKA_NIJE_DETE_KOLA =
  "Ovo možeš kad postaneš dete Kola — kad roditelj postane član Kola i neko potvrdi da ima tebe.";

/** Poruka detetu sa roditeljem koje pokušava da piše nekome ko mu nije prijatelj. */
export const PORUKA_SAMO_PRIJATELJI = "Za sada pišeš samo svojim prijateljima.";

/**
 * Poruka koju vidi dete čiji nalog čeka roditelja. Jedna, na svim mestima.
 *
 * Govori DETETU, pa ne pominje „preuzimanje naloga": glagol „preuzeti" deci znači
 * uzeti nekome nešto, a ovde se dešava suprotno. Pravni pojam preuzimanja (čl. 11)
 * ostaje u roditeljskim ekranima i u aktima.
 */
export const PORUKA_CEKA_RODITELJA =
  "Još se čeka odobrenje mame ili tate. Dok ih čekaš, možeš da skupljaš prijatelje.";

// ── Uzrast ────────────────────────────────────────────────────────────────────

/**
 * Navršene godine na dati dan.
 *
 * 🔴 `danas` MORA biti beogradski dan (`beogradskiDan()` iz `obracunski-dan.ts`).
 * Golo `new Date()` u UTC-u pomera rođendan dva sata unazad u letnjem periodu —
 * dovoljno da uzrast pređe pre ponoći po lokalnom vremenu.
 */
export function uzrast(datumRodjenja: Date, danas: Date): number {
  let godine = danas.getUTCFullYear() - datumRodjenja.getUTCFullYear();
  const mesec = danas.getUTCMonth() - datumRodjenja.getUTCMonth();
  if (mesec < 0 || (mesec === 0 && danas.getUTCDate() < datumRodjenja.getUTCDate())) {
    godine -= 1;
  }
  return godine;
}

/**
 * Najkasniji datum rođenja pri kome je korisnik danas navršio `godine` godina.
 *
 * Postoji zbog upita nad bazom: uzrast se ne može računati u Prismi, pa se uslov
 * „ima najmanje N godina" izražava kao `datumRodjenja <= granica`. Računa se u
 * UTC-u, kao i `uzrast`, da se ta dva nikad ne raziđu za jedan dan.
 */
export function granicaDatumaZaUzrast(godine: number, danas: Date): Date {
  return new Date(
    Date.UTC(danas.getUTCFullYear() - godine, danas.getUTCMonth(), danas.getUTCDate())
  );
}

/** Dan kada nalog prelazi u punoletni (čl. 35 st. 1). */
export function datumPunoletstva(datumRodjenja: Date): Date {
  const d = new Date(datumRodjenja.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + UZRAST_PUNOLETSTVO);
  return d;
}

/** Da li uzrast dopušta otvaranje naloga maloletnog korisnika (čl. 2). */
export function uzrastZaModul(godine: number): Provera {
  if (!Number.isInteger(godine)) {
    return { ok: false, razlog: "Datum rođenja nije ispravan.", status: 400 };
  }
  if (godine < UZRAST_MIN) {
    return {
      ok: false,
      razlog: `Nalog se otvara detetu koje je navršilo ${UZRAST_MIN} godina.`,
      status: 400,
    };
  }
  if (godine >= UZRAST_PUNOLETSTVO) {
    return {
      ok: false,
      razlog: "Osoba koja je navršila 18 godina otvara nalog sama.",
      status: 400,
    };
  }
  return { ok: true };
}

// ── Ko sa kim ─────────────────────────────────────────────────────────────────

/** Da li je `dete` upravo dete tog roditelja. */
export function jeMojeDete(roditelj: Ucesnik, dete: Ucesnik): boolean {
  return dete.maloletan && dete.roditeljIds.includes(roditelj.id);
}

/**
 * Braća i sestre — bar jedan zajednički roditelj (čl. 33 st. 3).
 *
 * 🔴 Njihovo prijateljstvo se sklapa normalno, samo ne nosi POEN. Bez toga bi
 * šestoro dece jednog čoveka dalo petnaest parova bez ijednog stranca.
 */
export function suBracaISestre(a: Ucesnik, b: Ucesnik): boolean {
  return a.roditeljIds.some((r) => b.roditeljIds.includes(r));
}

/**
 * Da li sklopljeno prijateljstvo nosi POEN (čl. 33).
 *
 * Tri uslova, svi obavezni: obe strane su deca, obe su AKTIVNE i nisu braća.
 * Obostrano čekanje je i cela odbrana od farmovanja — lažni nalozi nikad ne postaju
 * aktivni, pa se POEN nikad ne upisuje i nema šta da se izvuče.
 */
export function prijateljstvoNosiPoen(a: Ucesnik, b: Ucesnik): boolean {
  if (!a.maloletan || !b.maloletan) return false;
  if (suBracaISestre(a, b)) return false;
  return poenSeUpisuje(a.stanje) && poenSeUpisuje(b.stanje);
}

/**
 * Da li par sme da komunicira i razmenjuje (čl. 22).
 *
 * Maloletni korisnici čine jedinstvenu grupu bez razvrstavanja po uzrastu, pa
 * međusobno smeju uvek — osim dok neki od naloga čeka roditelja. Sa punoletnim
 * korisnikom smeju samo uz saglasnost roditelja, a saglasnost stoji na DETETU, jer
 * je punoletni korisnik ne daje.
 *
 * Par dvoje punoletnih korisnika ovaj modul ne uređuje i propušta se dalje.
 */
export function smeDaKomunicira(a: Ucesnik, b: Ucesnik, suPrijatelji = false): Provera {
  if (!a.maloletan && !b.maloletan) return { ok: true };

  for (const u of [a, b]) {
    if (u.maloletan && u.stanje === "NA_CEKANJU") {
      return { ok: false, razlog: PORUKA_CEKA_RODITELJA, status: 403 };
    }
  }

  // 🔴 Dete sa roditeljem komunicira ISKLJUČIVO sa svojim prijateljima iz čl. 32
  // (čl. 5 st. 1 t. 2, 22 st. 6) — a prijatelji su uvek deca, pa sa punoletnim nikad.
  if ((a.maloletan && a.stanje === "POVEZANO") || (b.maloletan && b.stanje === "POVEZANO")) {
    if (a.maloletan && b.maloletan && suPrijatelji) return { ok: true };
    return { ok: false, razlog: PORUKA_SAMO_PRIJATELJI, status: 403 };
  }

  if (a.maloletan && b.maloletan) return { ok: true };

  const dete = a.maloletan ? a : b;
  // Uzrasna granica ide PRE prekidača: do 15 saglasnost roditelja ne otvara ništa
  // (čl. 22 st. 4). Zato se prekidač detetu do 14 i ne prikazuje.
  if (!smeSaOdraslima(dete)) {
    return { ok: false, razlog: PORUKA_SAMO_SA_DECOM, status: 403 };
  }
  if (dete.dozvolaOdrasli) return { ok: true };
  return {
    ok: false,
    razlog:
      "Razgovor između maloletnog i punoletnog korisnika otvara roditelj, na profilu svog deteta.",
    status: 403,
  };
}

/**
 * Da li posmatrač sme da POKRENE razgovor sa datim korisnikom.
 *
 * 🔴 Jedan izvor istine za rutu i za ekran (uvedeno 31.08.2026). Do tada je uslov
 * postojao na dva mesta i razišao se: `POST /api/poruke` je dete izričito puštao
 * (`if (!jaUcesnik.maloletan && !session.user.verified)`), a Pijaca je dugme
 * „Kontaktiraj" birala po `session.user.verified` — a maloletni nalog je TRAJNO
 * `verified: false`, jer u lanac potvrda ne ulazi (čl. 29 st. 2) i nikad neće.
 *
 * Posledica je bila da dete vidi tuđe oglase, ima POEN, a nema nijedno dugme koje
 * to dvoje spaja: umesto njega je dobijalo poziv da postane redovan član, sa
 * linkom na stranicu koju ne sme ni da otvori. Dečja ekonomija time nije imala
 * završetak, iako ga je server sve vreme dozvoljavao.
 *
 * Pravilo: za punoletne važi uslov iz Uslova čl. 14 st. 2 — potvrđen član piše kome
 * hoće, nov član oglašivaču povodom oglasa uz dnevni limit (set 4.8.1); čim je bar
 * jedna strana maloletna, odlučuje `smeDaKomunicira` (čl. 22).
 */
export function smePokrenutiRazgovor(
  ja: Ucesnik,
  drugi: Ucesnik,
  verifikovan: boolean,
  /**
   * Za novog člana (set 4.8.1, Uslovi čl. 14 st. 2): razgovor sme prvi da pokrene
   * samo sa oglašivačem povodom njegovog oglasa, uz dnevni limit iz
   * `nov-clan-pravila.ts`. Pozivno mesto javlja da li je povod oglas druge strane.
   */
  novClan?: { povodOglasom: boolean; pokrenutihDanas: number },
  /** Da li su strane prijatelji iz čl. 32 — dete sa roditeljem piše samo njima. */
  suPrijatelji = false,
): Provera {
  if (!ja.maloletan && !verifikovan) {
    const nov = smeNovRazgovor(novClan ?? { povodOglasom: false, pokrenutihDanas: 0 });
    if (!nov.ok) return { ok: false, razlog: nov.razlog, status: 403 };
  }
  if (ja.maloletan || drugi.maloletan) return smeDaKomunicira(ja, drugi, suPrijatelji);
  return { ok: true };
}

/**
 * Da li je prepis POEN-a dopušten (čl. 30).
 *
 * 🔴 Prepis je deo ažuriranja evidencije POEN-a, u kome učestvuje SAMO dete Kola
 * (čl. 30 st. 6, čl. 5 st. 1 t. 2): dete na čekanju i dete sa roditeljem ne
 * prepisuju ni sa svojim roditeljem, ni u jednom smeru.
 *
 * Roditelj i dete Kola prepisuju jedno drugom bez uslova, u oba pravca (čl. 30 st. 1) —
 * saglasnost iz čl. 20 st. 2 uređuje odnos sa TREĆIM punoletnim licima. Van toga važi
 * isto pravilo kao za komunikaciju.
 */
export function smeDaPrepise(od: Ucesnik, ka: Ucesnik): Provera {
  for (const u of [od, ka]) {
    if (!u.maloletan) continue;
    if (u.stanje === "NA_CEKANJU") return { ok: false, razlog: PORUKA_CEKA_RODITELJA, status: 403 };
    if (!smePrepis(u.stanje)) return { ok: false, razlog: PORUKA_NIJE_DETE_KOLA, status: 403 };
  }
  if (jeMojeDete(od, ka) || jeMojeDete(ka, od)) return { ok: true };
  return smeDaKomunicira(od, ka);
}

/**
 * Da li posmatrač sme da vidi oglas (čl. 24).
 *
 * Oglas maloletnog korisnika nije javno dostupan: vide ga maloletni korisnici i
 * njegovi roditelji, a uz saglasnost i punoletni korisnici. Gost ga ne vidi nikada.
 *
 * 🟡 Drugi smer — da li maloletni korisnik vidi oglase punoletnih — pravilnik ne
 * uređuje izričito. Vezan je za isti prekidač, jer je po čl. 22 odnos sa punoletnim
 * korisnicima u celini uslovljen saglasnošću; prikazivanje oglasa na koje dete ne
 * sme da se javi bilo bi i zbunjujuće i šire od dopuštenog kontakta.
 */
export function smeDaVidiOglas(
  posmatracUlaz: (Ucesnik & { admin?: boolean }) | null,
  oglasivac: Ucesnik
): boolean {
  // Dete na čekanju oglase vidi kao neprijavljen posetilac (čl. 5 st. 1 t. 1).
  const posmatrac = posmatracKaoGost(posmatracUlaz);
  if (posmatrac?.id === oglasivac.id) return true;
  if (!oglasivac.maloletan) {
    // Oglas punoletnog korisnika: javan je svima, a maloletnom se prikazuje uz
    // saglasnost — i tek od 15. godine (čl. 22 st. 3).
    if (!posmatrac?.maloletan) return true;
    return smeSaOdraslima(posmatrac) && posmatrac.dozvolaOdrasli;
  }
  if (!posmatrac) return false;
  if (posmatrac.id === oglasivac.id) return true;
  if (posmatrac.admin) return true;
  if (oglasivac.roditeljIds.includes(posmatrac.id)) return true;
  if (posmatrac.maloletan) return true;
  // Punoletnom posmatraču oglas deteta do 15 nije vidljiv ni uz saglasnost: kad
  // razmene ne sme da bude, prikaz oglasa je izlaganje bez svrhe (čl. 24 st. 3).
  return smeSaOdraslima(oglasivac) && oglasivac.dozvolaOdrasli;
}

/**
 * Posmatrač onako kako ga vide pravila vidljivosti oglasa: dete na čekanju vidi
 * Pijacu kao neprijavljen posetilac (čl. 5 st. 1 t. 1), pa se tretira kao `null`.
 */
export function posmatracKaoGost<T extends Ucesnik>(posmatrac: T | null): T | null {
  if (posmatrac?.maloletan && posmatrac.stanje === "NA_CEKANJU") return null;
  return posmatrac;
}

/**
 * Da li posmatrač vidi pseudonim oglašivača (čl. 5 st. 1 t. 2).
 *
 * 🔴 Dete sa roditeljem oglase vidi BEZ pseudonima oglašivača, osim oglasa svojih
 * prijatelja iz čl. 32 (i sopstvenih). Svi ostali vide pseudonim kao i do sada —
 * pseudonim oglašivača na Pijaci je javan. `prijatelji` je skup id-jeva prijatelja
 * posmatrača (`idPrijatelja()` iz `protokol/prijateljstva.ts`).
 */
export function smeVidetiPseudonimOglasivaca(
  posmatrac: Pick<Ucesnik, "id" | "maloletan" | "stanje"> | null,
  oglasivacId: string,
  prijatelji: ReadonlySet<string> | readonly string[],
): boolean {
  if (!posmatrac?.maloletan || posmatrac.stanje !== "POVEZANO") return true;
  if (posmatrac.id === oglasivacId) return true;
  const skup = prijatelji instanceof Set ? prijatelji : new Set(prijatelji as readonly string[]);
  return skup.has(oglasivacId);
}

/**
 * Da li posmatrač sme da otvori profil maloletnog korisnika.
 *
 * ─── Načelo ─────────────────────────────────────────────────────────────────
 *
 * 🔴 **Do deteta se dolazi samo kroz ono što je dete sámo objavilo.** Nikad kroz
 * profil, nikad kroz pretragu, nikad kroz spisak. Ranglista i knjiga zapisa
 * pokazuju da dete postoji — one nisu vrata ni u šta.
 *
 * Ovo je SUŽAVANJE u odnosu na zatečeno stanje: do sada je profil maloletnog naloga
 * bio dostupan svakom potvrđenom članu, i krio je samo indeks i lanac potvrda.
 *
 * ─── Šta zatvaranje stvarno štiti ───────────────────────────────────────────
 *
 * Ne krije detetove transakcije — knjiga zapisa je otvorena i tako ostaje, pa je
 * uporan čovek može prelistati. Krije sve ostalo SKUPLJENO NA JEDNOM MESTU: sliku,
 * opis, mesto, školu, prijateljstva i, najvažnije, ukupno stanje — a stanje je ono
 * što dete čini metom.
 *
 * ─── Ko ipak sme ────────────────────────────────────────────────────────────
 *
 *  - **Fondacija** — bez toga nema uklanjanja spornog oglasa ni postupanja po
 *    prijavi poruke; moderacija bi stala.
 *  - **Roditelj svog deteta** — uvid iz čl. 19, nepromenjen.
 *  - **Drugo dete, ali SAMO ako su prijatelji.** Dete iz iste škole koje mu nije
 *    prijatelj dobija isti zatvoren prikaz. Put do drugog deteta ostaje jedan:
 *    skeniran QR kod uživo.
 */
export function smeDaVidiProfilDeteta(
  posmatrac: (Ucesnik & { admin?: boolean }) | null,
  meta: Ucesnik,
  suPrijatelji: boolean
): boolean {
  // Profil punoletnog korisnika ovo pravilo ne dodiruje.
  if (!meta.maloletan) return true;
  if (!posmatrac) return false;
  if (posmatrac.id === meta.id) return true;
  if (posmatrac.admin) return true;
  if (meta.roditeljIds.includes(posmatrac.id)) return true;
  if (posmatrac.maloletan) return suPrijatelji;
  return false;
}

/**
 * Sme li nalog da uđe u lanac potvrda — kao onaj ko potvrđuje ILI kao meta
 * (čl. 29 st. 2 Pravilnika o učešću dece: maloletni korisnik u lanac potvrda ne ulazi).
 *
 * 🔴 **Provera je IZRIČITA, ne posredna preko indeksa.** Dete je
 * `TipKorisnika.NEVERIFIKOVAN` sa indeksom 0, pa ga smer „ko potvrđuje" već
 * obara `imaPristupVerifikaciji`. Smer „meta" NIJE obarao ništa: `verified` i
 * indeks su ono što se potvrdom DOBIJA, pa se njima meta ne može odbiti. Isti
 * razlog zbog koga i `smeUcestvovati` u `nabavka-pravila.ts` gleda `maloletan`
 * umesto da se osloni na indeks.
 *
 * Posledica propuštanja nije kozmetička: potvrđeno dete dobija `verified: true`
 * i indeks 10%, a na tome — ne na uzrastu — stoje ZRNO (`/api/zrno/upis`),
 * socijalni programi (`imaFunkcionalniPristup`), donacije, glas u Gornjem Kolu i
 * sopstveni verifikacioni kapacitet. Jedna propuštena provera otvara sve odjednom.
 *
 * 🔴 **Punoletstvo se oslanja na OVU funkciju.** `punoletstvo.ts` roditeljske
 * potvrde upisuje TEK pošto nalog pređe u punoletni (korak 4 posle koraka 3) —
 * baš zato što jezgro verifikacije maloletnu metu odbija. Ako se ovde ikad
 * doda izuzetak, taj redosled prestaje da bude zaštita i mora se čitati ponovo.
 */
export function smeULanacPotvrda(nalog: { maloletan: boolean }): boolean {
  return !nalog.maloletan;
}

/**
 * Poruka koju jezgro potvrde vraća maloletnom nalogu (čl. 29 st. 2).
 *
 * Kratka namerno: `kljucGreske()` iz srpskog teksta izvodi ključ i **seče ga na
 * 80 znakova**, pa duža rečenica daje ključ presečen usred reči — nečitljiv i,
 * gore, podložan sudaru sa drugom porukom koja deli istih 80 znakova.
 */
export const PORUKA_DETE_VAN_LANCA =
  "Maloletni nalog ne ulazi u lanac potvrda. Potvrde dobija na 18. rođendan.";

// ── Rokovi ───────────────────────────────────────────────────────────────────

/** Trenutak do koga link iz poruke roditelju važi (čl. 10 st. 3). */
export function rokTokena(poslatoAt: Date): Date {
  return new Date(poslatoAt.getTime() + ROK_TOKENA_DANA * 24 * 60 * 60 * 1000);
}

/** Trenutak do koga nalog deteta sme da čeka preuzimanje (čl. 10 st. 5). */
export function rokPreuzimanja(registrovanAt: Date): Date {
  return new Date(registrovanAt.getTime() + ROK_PREUZIMANJA_DANA * 24 * 60 * 60 * 1000);
}

/** Koliko je dana ostalo do isteka roka; 0 kad je rok prošao. */
export function danaDoIsteka(rokDo: Date, sada: Date): number {
  const ms = rokDo.getTime() - sada.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

// ── Punoletstvo (čl. 35) ─────────────────────────────────────────────────────

/**
 * Koliko se POEN-a otpisuje pri prelasku u punoletstvo.
 *
 * 🔴 Otpis pada na OBE strane: detetu `broj × 500`, i svakom od tih prijatelja po
 * 500. Ne broje se raskinuta prijateljstva (njihovih 500 je već otpisano — inače bi
 * isti POEN bio oduzet dvaput), prijateljstva sa braćom i sestrama (nikad nisu
 * nosila POEN) ni prijateljstva na čekanju (druga strana nikad nije postala
 * aktivna). Sve to nosi jedno polje: `Prijateljstvo.poenEvidentiran`.
 *
 * Razlog za otpis je uravnoteženje kanala. Prijateljstvo nosi 500 za trideset
 * sekundi u istoj prostoriji; potvrda stvarnosti nosi 1.000, ali traži da tvrdiš
 * tuđi identitet i da izgubiš sopstvenu potvrdu ako slažeš. Bez poništenja bi onaj
 * ko krene sa 17 godina odradio godinu jeftinog kanala, ušao u 18. sa zalihom, i
 * povrh toga dobio ceo skupi kanal — isti čovek, godina razlike, trajno drugačija
 * pozicija.
 */
export function otpisPriPunoletstvu(brojIsplacenihPrijateljstava: number): number {
  return Math.max(0, brojIsplacenihPrijateljstava) * PRIJATELJSTVO_POEN;
}

/**
 * Da li nalog treba da bude obrađen kao punoletan na dati dan.
 * `null` datum rođenja znači dete na čekanju — uzrast još niko nije upisao.
 */
export function jePunoletan(datumRodjenja: Date | null, danas: Date): boolean {
  if (!datumRodjenja) return false;
  return uzrast(datumRodjenja, danas) >= UZRAST_PUNOLETSTVO;
}

/** Da li je vreme za najavu punoletstva (mesec dana ranije, čl. 35 st. 5). */
export function vremeZaNajavuPunoletstva(datumRodjenja: Date | null, danas: Date): boolean {
  if (!datumRodjenja) return false;
  const punoletstvo = datumPunoletstva(datumRodjenja);
  if (punoletstvo.getTime() <= danas.getTime()) return false;
  return danaDoIsteka(punoletstvo, danas) <= NAJAVA_PUNOLETSTVA_DANA;
}

// Pojam „mirovanje" (prva verzija) je ukinut: kad roditelju padne potvrđenost,
// nalog deteta prelazi u stanje „dete sa roditeljem" (čl. 6 st. 2), nijedan podatak se ne
// briše, a nalog roditelja se ne dira.
