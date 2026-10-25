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
