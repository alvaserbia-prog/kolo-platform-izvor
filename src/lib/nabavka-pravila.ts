/**
 * Kolektivna nabavka — ČISTE funkcije, bez Prisme.
 *
 * Zaseban fajl zato što ovu aritmetiku čita i pretraživač: ekran nabavke prikazuje
 * istu kalkulaciju koju server snima na zapis, a admin ekran je računa pre objave.
 * Da pravila žive uz servisne funkcije (koje uvoze Prismu), klijent bi morao da
 * drži SOPSTVENU prepisanu kopiju — a takva kopija je u ovom repou već jednom
 * odlutala (tabela donacija u admin panelu nosila je nivoe pokroviteljstva).
 *
 * `src/lib/protokol/nabavka.ts` sve ovo re-eksportuje, pa server ima jedan ulaz.
 *
 * Osnov: Pravilnik o projektima i kolektivnim nabavkama (set 4.4.3), čl. 5, 8,
 * 15, 17, 18, 19, 21, 22, 23 i 26; Pravilnik o KOLO sistemu čl. 14a i 51a.
 *
 * 🔴 Brojevi iz ovog fajla stoje DOSLOVNO u aktu i zaključani su testom
 * `pravni-dokumenti.test.ts`. Izmena konstante ovde bez izmene akta razilazi normu
 * i primenu — isto pravilo kao kapa i prag iz čl. 40b.
 */

// ─── Konstante iz akta ────────────────────────────────────────────────────────

/** Čl. 8 st. 2 — koeficijent trošenja. 1,00 = „potroši sve iznad rezerve". */
export const KOEFICIJENT_TROSENJA = 1.0;

/** Čl. 5 st. 3 — operativna rezerva = tri operativna troška prethodnog meseca. */
export const MESECI_REZERVE = 3;

/** Čl. 15 st. 1 — najmanje toliko ponuda pre izbora najpovoljnije. */
export const NAJMANJE_PONUDA = 3;

/*
 * Čl. 21 st. 2 — prijava NE zavisi od broja POEN-a u zapisu (set 4.7.8, odluka
 * vlasnika). Prag od 20.000 POEN-a je ukinut: broj POEN-a određuje samo mesto u
 * redu (čl. 22), a ko u trenutku potvrde nema dovoljno POEN-a ne može potvrditi
 * učešće (čl. 23). 🔴 Najmanji broj POEN-a za prijavu se ne vraća — ni pri prijavi
 * ni pri utvrđivanju reda. Brana: `nabavka-bez-praga-izvor.test.ts`.
 */

/** Čl. 21 st. 2 — rok za prijavu, u danima od objave kalkulacije. */
export const ROK_PRIJAVE_DANA = 3;

/** Čl. 23 st. 3 — rok za odgovor na poziv, u danima od upućivanja poziva. */
export const ROK_POTVRDE_DANA = 3;

/** Čl. 26 st. 2 — period preuzimanja, u danima. */
export const PERIOD_PREUZIMANJA_DANA = 3;

/** Čl. 32 — predlog se briše najkasnije po isteku toliko meseci od upisa. */
export const ROK_PREDLOGA_MESECI = 12;

/** Najveća dužina naziva dobra. Predlog je jedna reč ili kratak izraz, ne opis. */
export const MAX_DUZINA_NAZIVA = 40;
export const MIN_DUZINA_NAZIVA = 2;

// ─── Rečnik naziva ────────────────────────────────────────────────────────────

/**
 * Ključ za poklapanje naziva bez obzira na veličinu slova i višak razmaka.
 * Isti obrazac kao `User.pseudonimLower` — jedinstvenost drži baza nad ovim
 * poljem, pa se „Đubrivo", „đubrivo" i „  ĐUBRIVO " svode na jedan zapis.
 *
 * 🔴 Dijakritika se NE skida. „Djubrivo" i „đubrivo" su za sistem različiti nazivi,
 * i to je namerno: skidanjem kvačica bi se spojili i nazivi koji to nisu (npr.
 * „cep" i „ćep"), a rečnik ionako nudi postojeće nazive pri kucanju.
 */
export function normalizujNaziv(naziv: string): string {
  return naziv.trim().replace(/\s+/g, " ").toLocaleLowerCase("sr-RS");
}

/** Prikazni oblik: skraćen i sa jednostrukim razmacima, ali bez menjanja slova. */
export function ociscenNaziv(naziv: string): string {
  return naziv.trim().replace(/\s+/g, " ");
}

export function validanNaziv(naziv: string): boolean {
  const n = ociscenNaziv(naziv);
  if (n.length < MIN_DUZINA_NAZIVA || n.length > MAX_DUZINA_NAZIVA) return false;
  // Naziv dobra, ne rečenica: slova, brojevi, razmak i nekoliko spojnica.
  return /^[\p{L}\p{N}][\p{L}\p{N} .,%\-/]*$/u.test(n);
}

// ─── Sredstva (čl. 5 i 8) ─────────────────────────────────────────────────────

/**
 * Čl. 5 — sredstva raspoloživa za projekte.
 *
 * Rezerva je isti reper po kome se trajno gasi zaštitni veto (Gornje Kolo čl. 19),
 * pa nije proizvoljna cifra nego mera održivosti koju akti već priznaju.
 * Negativna razlika se svodi na nulu — nabavka se tada ne sprovodi.
 */
export function raspolozivoZaProjekte(saldoRSD: number, trosakPrethodnogMesecaRSD: number): number {
  const rezerva = trosakPrethodnogMesecaRSD * MESECI_REZERVE;
  return Math.max(0, saldoRSD - rezerva);
}

/**
 * Čl. 8 — gornja granica trošenja za jednu nabavku.
 *
 * 🔴 Od 4.4.3 ovo NIJE iznos koji se troši nego granica koja se ne sme preći.
 * Ranije je novac određivao količinu (količina = iznos ÷ cena); sada količinu
 * utvrđuje odluka o nabavci, a dinar ulazi tek kao provera staje li trošak unutar
 * granice. Razlika nije računska nego pravna: dok je novac određivao šta ko dobija,
 * raspodela je bila izvedena iz cene.
 */
export function gornjaGranicaTrosenja(raspolozivoRSD: number): number {
  return raspolozivoRSD * KOEFICIJENT_TROSENJA;
}

// ─── Parametri odluke i kalkulacija (čl. 17, 18) ──────────────────────────────

/**
 * Čl. 17 — parametre nabavke utvrđuje ODLUKA kojom se nabavka pokreće: ukupnu
 * količinu, veličinu jednog dela i broj POEN-a koji se poništava po delu.
 *
 * 🔴 Utvrđuju se PRE prikupljanja ponuda, pa se ne mogu izvesti iz dinarske cene —
 * ona u tom trenutku ne postoji. To je jedina brana koja tvrdnju iz čl. 19 („broj
 * POEN-a po delu nije cena dobra") čini proverljivom po samoj konstrukciji
 * postupka. `dodajPonudu` zato odbija ponudu dok parametri nisu utvrđeni.
 *
 * Ne vraćati izvođenje količine ili broja delova iz novca i cene.
 */
export interface ParametriOdluke {
  /** Ukupna količina dobra koja se nabavlja, u jedinicama mere. */
  kolicina: number;
  /** Veličina jednog dela, u istim jedinicama. */
  velicinaDela: number;
  /** Broj POEN-a koji se poništava preuzimanjem jednog dela. */
  poenPoDelu: number;
}

export function validniParametri(p: ParametriOdluke): boolean {
  if (!Number.isInteger(p.kolicina) || p.kolicina <= 0) return false;
  if (!Number.isInteger(p.velicinaDela) || p.velicinaDela <= 0) return false;
  if (!Number.isInteger(p.poenPoDelu) || p.poenPoDelu <= 0) return false;
  // Čl. 17 st. 2 — broj delova je količnik, pa količina mora biti deljiva bez
  // ostatka: ostatak bi značio deo manji od objavljenog, a delovi su jednaki.
  return p.kolicina % p.velicinaDela === 0;
}

/** Čl. 17 st. 2 — broj delova jednak je količniku količine i veličine dela. */
export function brojDelova(kolicina: number, velicinaDela: number): number {
  return Math.floor(kolicina / velicinaDela);
}

/** Čl. 18 st. 1 — ukupan dinarski trošak = ukupna količina × nabavna cena. */
export function ukupanTrosak(kolicina: number, nabavnaCenaPoJedinici: number): number {
  return kolicina * nabavnaCenaPoJedinici;
}

export interface UlazKalkulacije {
  saldoRSD: number;
  trosakPrethodnogMesecaRSD: number;
  /** Čl. 17 — odlučeni parametri, poznati pre tendera. */
  parametri: ParametriOdluke;
  /** Čl. 18 — nabavna cena po jedinici iz izabrane ponude. */
  nabavnaCena: number;
}

export interface Kalkulacija {
  rezervaRSD: number;
  raspolozivoRSD: number;
  gornjaGranicaRSD: number;
  kolicina: number;
  velicinaDela: number;
  brojDelova: number;
  poenPoDelu: number;
  ukupnoPoena: number;
  ukupnoRSD: number;
}

/**
 * Čl. 5 → 18 u jednom pozivu. Vraća `null` kad nabavka nije moguća: nema sredstava
 * iznad rezerve, parametri nisu ispravni, ili ukupan trošak prelazi gornju granicu.
 *
 * 🔴 Prekoračenje granice NIJE greška u unosu nego ishod tendera (čl. 18 st. 2):
 * nabavka se tada ne sprovodi, sredstva ostaju za narednu, a nova odluka može
 * utvrditi manju količinu. Ne „skraćivati" količinu automatski — time bi novac
 * ponovo određivao raspodelu.
 */
export function izracunajKalkulaciju(ulaz: UlazKalkulacije): Kalkulacija | null {
  const rezervaRSD = ulaz.trosakPrethodnogMesecaRSD * MESECI_REZERVE;
  const raspolozivoRSD = raspolozivoZaProjekte(ulaz.saldoRSD, ulaz.trosakPrethodnogMesecaRSD);
  if (raspolozivoRSD <= 0) return null;
  if (!validniParametri(ulaz.parametri)) return null;
  if (!Number.isFinite(ulaz.nabavnaCena) || ulaz.nabavnaCena <= 0) return null;

  const gornjaGranicaRSD = gornjaGranicaTrosenja(raspolozivoRSD);
  const ukupnoRSD = ukupanTrosak(ulaz.parametri.kolicina, ulaz.nabavnaCena);
  if (ukupnoRSD > gornjaGranicaRSD) return null;

  const delova = brojDelova(ulaz.parametri.kolicina, ulaz.parametri.velicinaDela);

  return {
    rezervaRSD,
    raspolozivoRSD,
    gornjaGranicaRSD,
    kolicina: ulaz.parametri.kolicina,
    velicinaDela: ulaz.parametri.velicinaDela,
    brojDelova: delova,
    poenPoDelu: ulaz.parametri.poenPoDelu,
    ukupnoPoena: ulaz.parametri.poenPoDelu * delova,
    ukupnoRSD,
  };
}

// ─── Red (čl. 22) ─────────────────────────────────────────────────────────────

export interface StavkaReda {
  userId: string;
  /** Broj POEN-a u trenutku isteka roka za prijavu. */
  poen: number;
  /** Kada se korisnik prijavio. */
  prijavljenoAt: Date;
  /** Kada je nalog otvoren — poslednje merilo pri potpunoj izjednačenosti. */
  nalogOd: Date;
}

/**
 * Čl. 22 — red po broju POEN-a, od većeg ka manjem.
 *
 * 🔴 Nije „rang" u smislu statusa nego prosto količina: mesto u redu ne proizvodi
 * dejstvo izvan te nabavke (st. 4). Izjednačenost se razrešava do kraja — ranija
 * prijava, pa stariji nalog — jer bi neodređen redosled bio svađa nad javnim
 * spiskom.
 */
export function poredjajRed<T extends StavkaReda>(stavke: T[]): T[] {
  return [...stavke].sort((a, b) => {
    if (b.poen !== a.poen) return b.poen - a.poen;
    const p = a.prijavljenoAt.getTime() - b.prijavljenoAt.getTime();
    if (p !== 0) return p;
    return a.nalogOd.getTime() - b.nalogOd.getTime();
  });
}

// ─── Rokovi (čl. 21, 23, 26) ──────────────────────────────────────────────────

/**
 * Kraj dana koji pada `plusDana` posle datog trenutka, u ponoć.
 *
 * Rokovi se mere do kraja dana, ne na sat tačno: nabavka objavljena u 14 časova
 * daje svakome pune tri dana, a ne dva i po. Isti obračunski ritam kao ostatak
 * sistema (ponoć do ponoći).
 */
export function krajDana(od: Date, plusDana: number): Date {
  const d = new Date(od);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + plusDana + 1);
  return d;
}

/** Čl. 21 st. 2 — rok za prijavu ističe krajem trećeg dana od objave. */
export function rokPrijave(objavljenoAt: Date): Date {
  return krajDana(objavljenoAt, ROK_PRIJAVE_DANA);
}

/** Čl. 23 st. 3 — rok za odgovor na poziv ističe krajem trećeg dana od poziva. */
export function rokPotvrde(pozvanAt: Date): Date {
  return krajDana(pozvanAt, ROK_POTVRDE_DANA);
}

/** Čl. 26 st. 2 — period preuzimanja traje tri dana od prvog dana preuzimanja. */
export function krajPeriodaPreuzimanja(preuzimanjeOd: Date): Date {
  return krajDana(preuzimanjeOd, PERIOD_PREUZIMANJA_DANA - 1);
}

/**
 * Čl. 23 st. 2 — upisan dan preuzimanja mora pasti unutar objavljenog perioda.
 * Bez te granice lanac poziva ne bi imao kraj: neko bi upisao datum za pola godine
 * i time zauvek zauzeo deo.
 */
export function danJeUPeriodu(dan: Date, od: Date, doDatuma: Date): boolean {
  const d = new Date(dan);
  d.setHours(0, 0, 0, 0);
  const o = new Date(od);
  o.setHours(0, 0, 0, 0);
  return d.getTime() >= o.getTime() && d.getTime() < doDatuma.getTime();
}

/** Čl. 32 — najkasniji trenutak brisanja predloga koji niko nije osvežio. */
export function predlogIstice(upisanAt: Date): Date {
  const d = new Date(upisanAt);
  d.setMonth(d.getMonth() + ROK_PREDLOGA_MESECI);
  return d;
}

// ─── Ko učestvuje (čl. 4) ─────────────────────────────────────────────────────

/**
 * Funkcionalni prag indeksa (čl. 4 Pravilnika o dokazu stvarnosti). Prepisan
 * ovde umesto uvezen, jer ovaj modul namerno nema uvoza — čitaju ga i ekrani.
 */
export const FUNKCIONALNI_PRAG_INDEKSA_NABAVKA = 10;

export interface UcesnikProvera {
  maloletan: boolean;
  deaktiviranAt: Date | null;
  status: string;
  /**
   * Potvrđena stvarnost (mera P-1 uz R-01). Dobra se raspodeljuju korisnicima
   * programa u smislu čl. 9 st. 4 Statuta, a to mora biti lice čija je stvarnost
   * potvrđena.
   */
  verified: boolean;
  indeksStvarnosti: number;
}

/**
 * Čl. 4 — u nabavci učestvuju punoletni korisnici sa aktivnim nalogom i
 * POTVRĐENOM STVARNOŠĆU (indeks ≥ 10%).
 *
 * 🔴 Maloletni nalog je isključen izričito, a ne posredno preko indeksa: dete sme
 * da ima POEN i ušlo bi u red, a ne sme da bude strana u preuzimanju robe.
 *
 * 🔴 Uslov potvrde je dodat merom P-1 uz R-01. Bez njega bi POEN pribavljen
 * PREPISOM na svež nepotvrđen nalog vodio do robe — novac → POEN → roba, bez
 * ijedne provere identiteta.
 */

export function smeUcestvovati(u: UcesnikProvera): boolean {
  if (u.maloletan) return false;
  if (u.deaktiviranAt) return false;
  if (!u.verified || u.indeksStvarnosti < FUNKCIONALNI_PRAG_INDEKSA_NABAVKA) return false;
  return u.status === "ACTIVE";
}

// ─── Izborno glasanje (Gornje Kolo čl. 8 st. 4, čl. 9 st. 2) ──────────────────

export interface MogucnostIzbora {
  /** Id naziva dobra. */
  kljuc: string;
  /** Zbir glasačke moći datih glasova. */
  moc: number;
  /** Broj različitih korisnika koji su taj naziv predložili (prvo merilo pri izjednačenosti). */
  brojPredlagaca: number;
  /** Kada je naziv unet u registar (drugo merilo pri izjednačenosti). */
  unetAt: Date;
}

/**
 * Utvrđuje izabranu mogućnost pri izbornom glasanju.
 *
 * Pobeđuje najveći zbir glasačke moći. Izjednačenost razrešava merilo iz čl. 13
 * st. 2 posebnog pravilnika: veći broj različitih predlagača, pa raniji upis u
 * registar. Bez tog razrešenja izbor bi ostao neodređen, a glasanje bi se
 * ponavljalo bez ijednog razloga.
 *
 * Vraća `null` kad nema nijedne mogućnosti ili nijedan glas nije dat.
 */
export function utvrdiIzbor(mogucnosti: MogucnostIzbora[]): MogucnostIzbora | null {
  const sa = mogucnosti.filter((m) => m.moc > 0);
  if (sa.length === 0) return null;
  return [...sa].sort((a, b) => {
    if (b.moc !== a.moc) return b.moc - a.moc;
    if (b.brojPredlagaca !== a.brojPredlagaca) return b.brojPredlagaca - a.brojPredlagaca;
    return a.unetAt.getTime() - b.unetAt.getTime();
  })[0];
}
