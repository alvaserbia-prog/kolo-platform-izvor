-- Oznaka početnog nosioca ZRNA (osnivač). Zaseban marker pored tipKorisnika/admin:
-- status NOSILAC_ZRNA može kasnije steći i običan korisnik (upis ZRNA), pa nije
-- pouzdan pokazatelj osnivača. Koristi se za zabranu da osnivač verifikuje osnivača.
ALTER TABLE "User" ADD COLUMN "jeOsnivac" BOOLEAN NOT NULL DEFAULT false;
