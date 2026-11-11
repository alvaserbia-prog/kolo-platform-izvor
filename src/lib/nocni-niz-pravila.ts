/**
 * Ponoćni niz (odluka vlasnika 11.11.2026): svi poslovi vezani za obračunski period kreću
 * u ponoć po srpskom vremenu, leti i zimi, i to REDOM — posle zatvaranja perioda
 * (`/api/cron/nocna-emisija`: ZRNO → programi → zabeleženo pokroviteljstvo, partnerstvo i
 * lanac), jedan za drugim. Svaki korak je zaseban poziv sopstvene rute, pa pad jednog ne
 * zaustavlja ostale i ne troši vreme drugog.
 *
 * 🔴 Redosled je pravilo, ne slučajnost: period mora biti zatvoren pre nabavki, gazdinstava
 * i POEN-a po potvrdi, a provera zero-sum je POSLEDNJA jer proverava sve pre nje.
 * 🔴 Ovi koraci nemaju sopstveni raspored u `vercel.json` — dvostruko pokretanje bi, na
 * primer, dalo dva kruga dodatnih delova nabavke u danu.
 * Čišćenja (Pričaonica, nadzorni predmeti, GDPR) i STIPS nisu vezani za period i imaju
 * sopstveni raspored.
 *
 * Čisto pravilo, bez Prisme (CLAUDE.md pravilo 9).
 */
export const NOCNI_NIZ = [
  "/api/cron/deca-punoletstvo",
  "/api/cron/programi-revizija",
  "/api/cron/glasanje-zatvaranje",
  "/api/cron/gazdinstva",
  "/api/cron/potvrde-uslov",
  "/api/cron/nabavke",
  "/api/cron/nadzor-integriteta",
  "/api/cron/zero-sum",
] as const;

/** Najduže čekanje na jedan korak; korak koji ne odgovori se beleži, a niz ide dalje. */
export const ROK_KORAKA_MS = 240_000;
