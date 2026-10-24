-- Razdvajanje admin ovlascenja od clanskog tipa (TipKorisnika).
-- Nova kolona "admin" (NONE/ADMIN/SUPERADMIN) nosi operativna ovlascenja
-- nezavisno od clanskog statusa. Postojeci POCETNI nalozi (UO / osnivaci)
-- postaju SUPERADMIN. tipKorisnika se NE menja u ovom koraku (founders ostaju
-- POCETNI dok se enum ne ocisti u kasnijoj migraciji).
CREATE TYPE "AdminNivo" AS ENUM ('NONE', 'ADMIN', 'SUPERADMIN');

ALTER TABLE "User" ADD COLUMN "admin" "AdminNivo" NOT NULL DEFAULT 'NONE';

UPDATE "User" SET "admin" = 'SUPERADMIN' WHERE "tipKorisnika" = 'POCETNI';
