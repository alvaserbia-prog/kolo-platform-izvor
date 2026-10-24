-- Backfill postojećih objava sa slobodnim tekstom.
--
-- Zasebna migracija JE OBAVEZNA: PostgreSQL ne dozvoljava korišćenje nove enum
-- vrednosti ('NEPOTPUN') u istoj transakciji u kojoj je dodata (prethodna
-- migracija). Prisma svaku migraciju pušta u sopstvenoj transakciji.
--
-- Stari tekst se NE PARSIRA u ime/mesto — pogrešno izvučeno ime je gore od
-- nikakvog. Arhivira se u `legacyTekst`, a zahtev prelazi u NEPOTPUN: ostaje
-- vidljiv na zidu, ne ulazi u feed, a vlasnik dobija poziv da dopuni karticu.

UPDATE "ZahtevZaJemstvo"
SET "legacyTekst" = "tekstPredstavljanja"
WHERE "tekstPredstavljanja" IS NOT NULL
  AND "legacyTekst" IS NULL;

UPDATE "ZahtevZaJemstvo"
SET "status" = 'NEPOTPUN'
WHERE "status" = 'AKTIVAN'
  AND "ime" IS NULL
  AND "mesto" IS NULL;
