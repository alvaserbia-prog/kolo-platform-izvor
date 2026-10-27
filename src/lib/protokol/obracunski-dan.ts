// ── Obračunski dan po srpskom vremenu (Europe/Belgrade) ───────────────────────
//
// Obračunski period sistema je „ponoć do ponoći" po srpskom lokalnom vremenu,
// a serveri (Vercel) rade u UTC. Kalendarski dan se zato računa u beogradskoj
// zoni, a čuva kao Date na UTC ponoći tog dana — isti oblik kakav `date` kolone
// već imaju u bazi (ponoć bez vremena), pa su postojeći redovi kompatibilni.
//
// Noćni cron je zakazan dvaput, u 22:00 i u 23:00 UTC (Vercel ne zna za letnje
// računanje). Leti (CEST, UTC+2) ponoć je 22:00 UTC, zimi (CET, UTC+1) 23:00 UTC;
// prolaz radi samo onaj termin koji pada u ponoć po srpskom vremenu
// (`jePonocUSrbiji`), drugi ne radi ništa. `danObracuna` gleda 2h unapred — ručni
// prolaz pokrenut u 22–24h po lokalnom vremenu pripada ponoći koja sledi.

const ZONA = "Europe/Belgrade";

/** Kalendarski dan u beogradskoj zoni za dati trenutak, kao Date na UTC ponoći. */
export function beogradskiDan(trenutak: Date = new Date()): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [g, m, d] = fmt.format(trenutak).split("-").map(Number);
  return new Date(Date.UTC(g, m - 1, d));
}

/** Da li je dati trenutak u satu posle ponoći (00:00–00:59) po srpskom vremenu.
 *  Ceo sat, jer Vercel cron ume da kasni u okviru zakazanog sata. */
export function jePonocUSrbiji(trenutak: Date = new Date()): boolean {
  const sat = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(trenutak);
  return Number(sat) === 0;
}

/** Obračunski dan koji noćni prolaz OTVARA (ponoć koju taj prolaz predstavlja). */
export function danObracuna(trenutak: Date = new Date()): Date {
  return beogradskiDan(new Date(trenutak.getTime() + 2 * 60 * 60 * 1000));
}

/** Dan pre datog dana (zahtevi podneti tokom dana koji se upravo završio). */
export function prethodniDan(dan: Date): Date {
  const p = new Date(dan);
  p.setUTCDate(p.getUTCDate() - 1);
  return p;
}

/**
 * Stvarni trenutak ponoći po srpskom vremenu kojom POČINJE dati obračunski dan
 * (`dan` je oblik iz `beogradskiDan`: Date na UTC ponoći kalendarskog dana).
 * Leti je to 22:00 UTC prethodnog dana, zimi 23:00 UTC. Letnje računanje se
 * menja u 02:00/03:00, pa je pomak u ponoć isti kao sat ranije.
 */
export function ponocUSrbiji(dan: Date): Date {
  const utcPonoc = Date.UTC(dan.getUTCFullYear(), dan.getUTCMonth(), dan.getUTCDate());
  const proba = new Date(utcPonoc - 60 * 60 * 1000);
  const delovi = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(proba);
  const v = (t: string) => Number(delovi.find((d) => d.type === t)?.value);
  const zidno = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  const pomak = zidno - proba.getTime(); // +1h zimi, +2h leti
  return new Date(utcPonoc - pomak);
}

/**
 * Početak obračunskog perioda koji je `n` perioda posle onoga u kome je
 * `trenutak` (n = 1: naredna ponoć po srpskom vremenu). Pravilnik čl. 26.
 */
export function pocetakPeriodaPosle(trenutak: Date, n: number): Date {
  const dan = beogradskiDan(trenutak);
  dan.setUTCDate(dan.getUTCDate() + n);
  return ponocUSrbiji(dan);
}

/**
 * Granice prethodnog kalendarskog meseca po srpskom vremenu, u obliku `date`
 * kolona (UTC ponoć): `[od, doIskljucivo)`.
 */
export function granicePrethodnogMeseca(trenutak: Date = new Date()): { od: Date; doIskljucivo: Date } {
  const danas = beogradskiDan(trenutak);
  const g = danas.getUTCFullYear();
  const m = danas.getUTCMonth();
  return { od: new Date(Date.UTC(g, m - 1, 1)), doIskljucivo: new Date(Date.UTC(g, m, 1)) };
}
