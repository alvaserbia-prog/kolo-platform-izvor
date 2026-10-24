-- Doprinos sadržaju platforme — osmi kanal evidentiranja POEN-a.
-- Osnov: Pravilnik o KOLO sistemu 4.1.0 čl. 15 tačka 8 i čl. 40a.
--
-- Korisniku se JEDNOKRATNO evidentira 1.000 POEN-a za prvi oglas kojim nudi dobro
-- ili uslugu i koji ispunjava sadržinski minimum iz Uslova korišćenja.
--
-- Doprinos se BELEŽI pri objavi oglasa, a EVIDENTIRA tek kad nastupi prvi od dva
-- događaja: verifikacija u lancu jemstva ili ažuriranje evidencije POEN-a u korist
-- tog korisnika (čl. 40a st. 3). Do evidentiranja to nije zapis POEN-a i ne ulazi
-- u ukupan broj evidentiranih POEN-a — bez tog razdvajanja bi prazni nalozi mogli
-- da naduvaju opticaj i okinu osnivački korak.

-- 1. Nov tip transakcije
ALTER TYPE "TransactionType" ADD VALUE 'EMISIJA_SADRZAJ';

-- 2. Stanja i okidači
CREATE TYPE "DoprinosStatus" AS ENUM ('ZABELEZEN', 'EVIDENTIRAN', 'PONISTEN');
CREATE TYPE "DoprinosOkidac" AS ENUM ('VERIFIKACIJA', 'PRIMLJEN_POEN');

-- 3. Zapis doprinosa
--    `userId` je JEDINSTVEN — jednokratnost kanala po čoveku obezbeđuje baza, ne
--    kod: dve paralelne objave oglasa ne mogu da zabeleže dva doprinosa.
CREATE TABLE "DoprinosSadrzaju" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oglasId" TEXT,
    "iznos" INTEGER NOT NULL DEFAULT 1000,
    "status" "DoprinosStatus" NOT NULL DEFAULT 'ZABELEZEN',
    "okidac" "DoprinosOkidac",
    "transakcijaId" TEXT,
    "zabelezenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidentiranAt" TIMESTAMP(3),
    "ponistenAt" TIMESTAMP(3),
    "okidacKorisnikId" TEXT,

    CONSTRAINT "DoprinosSadrzaju_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DoprinosSadrzaju_userId_key" ON "DoprinosSadrzaju"("userId");
CREATE INDEX "DoprinosSadrzaju_status_idx" ON "DoprinosSadrzaju"("status");
-- Osmatranje obrasca iz odeljka 05 plana: isti član okida evidentiranje za više
-- različitih naloga u kratkom roku.
CREATE INDEX "DoprinosSadrzaju_okidacKorisnikId_evidentiranAt_idx" ON "DoprinosSadrzaju"("okidacKorisnikId", "evidentiranAt");

ALTER TABLE "DoprinosSadrzaju"
  ADD CONSTRAINT "DoprinosSadrzaju_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Brisanje oglasa ne briše činjenicu doprinosa — veza se samo prekida.
ALTER TABLE "DoprinosSadrzaju"
  ADD CONSTRAINT "DoprinosSadrzaju_oglasId_fkey"
  FOREIGN KEY ("oglasId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
