// ── Obračunski dan po srpskom vremenu (Europe/Belgrade) ───────────────────────
//
// Obračunski period sistema je „ponoć do ponoći" po srpskom lokalnom vremenu,
// a serveri (Vercel) rade u UTC. Kalendarski dan se zato računa u beogradskoj
// zoni, a čuva kao Date na UTC ponoći tog dana — isti oblik kakav `date` kolone
// već imaju u bazi (ponoć bez vremena), pa su postojeći redovi kompatibilni.
//
// Noćni cron je zakazan na 22:00 UTC: leti (CEST, UTC+2) to je tačno ponoć po
// srpskom vremenu, zimi (CET, UTC+1) 23:00. `danObracuna` zato gleda 2h unapred —
// prolaz pokrenut u 22–24h po lokalnom vremenu pripada ponoći koja sledi, pa i
// zimski termin od 23:00 otvara ispravan (naredni) obračunski dan.

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
