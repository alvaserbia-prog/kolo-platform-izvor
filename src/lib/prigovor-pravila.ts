/**
 * Prigovor Fondaciji — ČISTA pravila (bez Prisme).
 *
 * Fajl je bez ijednog `import`-a jer ga uvozi i obrazac na profilu u pretraživaču
 * i serverske rute — jedno mesto istine, isti uslov na obe strane.
 *
 * Osnov: **Uslovi korišćenja čl. 37a** (set 4.5.4). Do tog seta prigovor je bio
 * institut bez sopstvenog člana — Uslovi su ga pominjali samo uz isključenje
 * (čl. 28) — a razmena i kolektivna nabavka nisu imale nijedan put. Od 4.5.4
 * postoji jedan institut, jedan obrazac na profilu i jedno mesto odlučivanja.
 *
 * 🔴 Tri vrste traže PREDMET. Prigovor na prepis, prigovor na deo iz nabavke i
 * prigovor na vaučer (neizvršenje obaveze davaoca) vode se o TAČNO JEDNOM zapisu; bez predmeta administrator ne zna šta da obori,
 * a odluka se ne može vezati za pravu transakciju. Zato `predmetId` nije ukras
 * nego uslov (čl. 37a st. 3).
 *
 * 🔴 Kapa se meri PO VRSTI, ne globalno. Ranije je važilo „najviše 3 otvorena
 * prigovora" ukupno — ko ima tri otvorena, a istekne mu sedmodnevni rok za
 * nabavku, izgubio bi pravo zbog kočnice protiv spama. Kočnica ostaje, ali ne
 * preko roka.
 */

/** Najviše otvorenih prigovora PO VRSTI (Uslovi čl. 37a st. 5). */
export const MAX_OTVORENIH_PO_VRSTI = 3;

/** Najkraći opis koji nešto govori Fondaciji. */
export const MIN_OPIS_PRIGOVORA = 10;

/** Rok za prigovor na nedostatak dela iz nabavke — od obaveštenja o preuzimanju. */
export const ROK_NABAVKA_DANA = 7;

/** Rok za prigovor koji se odnosi na razmenu — od prepisa, odnosno od poništenja. */
export const ROK_RAZMENA_DANA = 30;

/**
 * Rok za prigovor na neizvršenje obaveze iz vaučera — najkasnije petnaest dana od
 * isteka roka važenja vaučera (Uslovi čl. 37a st. 4). Rok teče od `vaziDo`.
 */
export const ROK_VAUCER_POSLE_ISTEKA_DANA = 15;

/** Rok u kome se druga strana izjašnjava pre odluke (Pravilnik čl. 16 st. 10). */
export const ROK_IZJASNJENJA_DANA = 7;

/** Opšti rok za prigovor na ostale odluke Fondacije. */
export const ROK_OPSTI_DANA = 30;

export type VrstaPrigovora =
  | "RAZMENA"
  | "NABAVKA"
  | "VAUCER"
  | "POTVRDA"
  | "RODITELJSTVO"
  | "VERIFIKACIJA"
  | "SUSPENZIJA"
  | "PROGRAM"
  | "GAZDINSTVO"
  | "OGLAS"
  | "PODACI"
  | "OSTALO";

export type OpisVrste = {
  /** Traži li se predmet (id prepisa, prijave na nabavku odnosno vaučera). */
  predmet: boolean;
  /** Rok u danima od događaja; `null` = nije vezan rokom. */
  rokDana: number | null;
};

/**
 * Spisak vrsta iz čl. 37a st. 2. Redosled je i redosled u obrascu — prve tri su
 * one koje traže predmet, jer se po njima najčešće piše.
 */
export const VRSTE_PRIGOVORA: Record<VrstaPrigovora, OpisVrste> = {
  RAZMENA: { predmet: true, rokDana: ROK_RAZMENA_DANA },
  NABAVKA: { predmet: true, rokDana: ROK_NABAVKA_DANA },
  // Neizvršenje obaveze davaoca iz vaučera dodeljenog u raspodeli dobara i usluga
  // iz pokroviteljstva (Uslovi čl. 37a st. 2; donacije čl. 13j). Predmet je id vaučera.
  VAUCER: { predmet: true, rokDana: ROK_VAUCER_POSLE_ISTEKA_DANA },
  // 🟡 Odnosila se na ukinut postupak potvrde postojanja deteta od 60 dana. Ostaje u
  // tipu zbog zatečenih prigovora, ali se u obrascu ne nudi (`VRSTE_U_OBRASCU`).
  POTVRDA: { predmet: false, rokDana: ROK_OPSTI_DANA },
  // Odluka o prijavi lažnog roditeljstva (Pravilnik o učešću dece čl. 4e st. 6) i
  // poništenje potvrde postojanja deteta (čl. 6 st. 6). Podnose je podnosilac
  // prijave i lice na koje se prijava odnosi (Uslovi čl. 37a st. 2, set 4.8.2).
  RODITELJSTVO: { predmet: false, rokDana: ROK_OPSTI_DANA },
  VERIFIKACIJA: { predmet: false, rokDana: null },
  SUSPENZIJA: { predmet: false, rokDana: null },
  PROGRAM: { predmet: false, rokDana: ROK_OPSTI_DANA },
  // Odluka o prijavi gazdinstva, o pristupanju i o poništenju odobrenja, prestanak
  // gazdinstva i otpis doprinosa gazdinstva (Uslovi čl. 37a st. 2; gazd. čl. 12
  // st. 4, 12a st. 7). Rok kao za ostale odluke Fondacije.
  GAZDINSTVO: { predmet: false, rokDana: ROK_OPSTI_DANA },
  OGLAS: { predmet: false, rokDana: ROK_OPSTI_DANA },
  PODACI: { predmet: false, rokDana: null },
  OSTALO: { predmet: false, rokDana: null },
};

export const SVE_VRSTE = Object.keys(VRSTE_PRIGOVORA) as VrstaPrigovora[];

/** Vrste koje se nude u obrascu — bez ukinutih (zatečeni prigovori i dalje važe). */
export const UKINUTE_VRSTE: readonly VrstaPrigovora[] = ["POTVRDA"];
export const VRSTE_U_OBRASCU = SVE_VRSTE.filter((v) => !UKINUTE_VRSTE.includes(v));

export function jeVrstaPrigovora(v: unknown): v is VrstaPrigovora {
  return typeof v === "string" && v in VRSTE_PRIGOVORA;
}

export function trebaPredmet(v: VrstaPrigovora): boolean {
  return VRSTE_PRIGOVORA[v].predmet;
}

/** Dodaje dane na trenutak; koristi se i za rok prigovora i za rok izjašnjenja. */
export function rokOd(pocetak: Date, dana: number): Date {
  return new Date(pocetak.getTime() + dana * 24 * 60 * 60 * 1000);
}

/** Je li rok za podnošenje istekao. Bez roka (`null`) nikad ne ističe. */
export function rokIstekao(pocetak: Date, dana: number | null, sada: Date): boolean {
  if (dana === null) return false;
  return sada.getTime() > rokOd(pocetak, dana).getTime();
}

export type UlazPrigovora = {
  vrsta: VrstaPrigovora;
  opis: string;
  /** Predmet — obavezan za vrste iz `trebaPredmet`. */
  predmetId: string | null;
  /** Koliko prigovora ISTE vrste ovog korisnika još čeka odgovor. */
  otvorenihIsteVrste: number;
  /** Trenutak od koga teče rok; `null` kad vrsta nije vezana rokom. */
  pocetakRoka: Date | null;
  sada: Date;
};

export type IshodPrigovora = { ok: true } | { ok: false; razlog: string };

export function smePodneti(u: UlazPrigovora): IshodPrigovora {
  const opis = VRSTE_PRIGOVORA[u.vrsta];

  if (u.opis.trim().length < MIN_OPIS_PRIGOVORA)
    return {
      ok: false,
      razlog: `Opis mora imati najmanje ${MIN_OPIS_PRIGOVORA} znakova — po njemu se odlučuje.`,
    };

  if (opis.predmet && !u.predmetId)
    return { ok: false, razlog: "Izaberi na šta se prigovor odnosi." };

  if (u.otvorenihIsteVrste >= MAX_OTVORENIH_PO_VRSTI)
    return {
      ok: false,
      razlog: `Imaš ${MAX_OTVORENIH_PO_VRSTI} prigovora ove vrste koji čekaju odgovor. Sačekaj odgovor na njih.`,
    };

  if (u.pocetakRoka && rokIstekao(u.pocetakRoka, opis.rokDana, u.sada))
    return {
      ok: false,
      razlog: `Rok za prigovor je ${opis.rokDana} dana i istekao je.`,
    };

  return { ok: true };
}

/**
 * Sme li se odlučiti o prijavi razmene.
 *
 * 🔴 Ne sme dok druga strana ne dobije priliku da se izjasni (Pravilnik čl. 16
 * st. 10). Odluka gura tuđi zapis u minus; postupak u kome se saslušava samo
 * jedna strana za takvu posledicu nije dovoljan. Rok teče od obaveštenja koje
 * ide pri otvaranju slučaja.
 */
export function smeOdlucitiORazmeni(u: {
  izjasnjenjeDo: Date | null;
  odgovorProtivAt: Date | null;
  sada: Date;
}): IshodPrigovora {
  if (u.odgovorProtivAt) return { ok: true };
  if (!u.izjasnjenjeDo) return { ok: true };
  if (u.sada.getTime() <= u.izjasnjenjeDo.getTime())
    return {
      ok: false,
      razlog: "Druga strana ima rok da se izjasni. Odluka je moguća po isteku roka.",
    };
  return { ok: true };
}
