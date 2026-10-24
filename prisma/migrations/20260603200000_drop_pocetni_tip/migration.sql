-- Korak 7 refaktora uloga: clanski tip vise ne nosi admin znacenje.
-- Osnivaci (POCETNI) postaju NOSILAC_ZRNA; admin ovlascenja iskljucivo preko
-- kolone "admin" (SUPERADMIN, postavljeno u prethodnoj migraciji).
-- POCETNI se uklanja iz enuma TipKorisnika. Postgres ne podrzava DROP VALUE,
-- pa se tip rekreira (isti obrazac kao raniji drop legacy enuma).
UPDATE "User" SET "tipKorisnika" = 'NOSILAC_ZRNA' WHERE "tipKorisnika" = 'POCETNI';

ALTER TYPE "TipKorisnika" RENAME TO "TipKorisnika_old";
CREATE TYPE "TipKorisnika" AS ENUM ('REGULARNI', 'NOSILAC_ZRNA', 'NEVERIFIKOVAN');
ALTER TABLE "User" ALTER COLUMN "tipKorisnika" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "tipKorisnika" TYPE "TipKorisnika" USING ("tipKorisnika"::text::"TipKorisnika");
ALTER TABLE "User" ALTER COLUMN "tipKorisnika" SET DEFAULT 'NEVERIFIKOVAN';
DROP TYPE "TipKorisnika_old";
