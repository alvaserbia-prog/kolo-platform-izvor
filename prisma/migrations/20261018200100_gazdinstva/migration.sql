-- Gazdinstva (Pravilnik o gazdinstvima, set 4.7.2). Gazdinstvo nema zapis u
-- Protokolu; doprinos (čl. 40c) ide u lični zapis člana, jednom po licu.
DO $$ BEGIN
  CREATE TYPE "GazdinstvoStatus" AS ENUM ('NACRT', 'NA_PREGLEDU', 'VRACENO', 'ODOBRENO', 'PONISTENO', 'UGASENO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "UlogaUGazdinstvu" AS ENUM ('NOSILAC', 'CLAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ClanGazdinstvaStatus" AS ENUM ('POZVAN', 'PRISTUPIO', 'ODOBREN', 'ODBIJEN', 'ISTUPIO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Gazdinstvo" (
    "id" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "bpg" TEXT,
    "neregistrovano" BOOLEAN NOT NULL DEFAULT false,
    "naselje" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "opis" TEXT NOT NULL,
    "status" "GazdinstvoStatus" NOT NULL DEFAULT 'NACRT',
    "upravljaId" TEXT,
    "razlogVracanja" TEXT,
    "podnetoAt" TIMESTAMP(3),
    "odobrenoAt" TIMESTAMP(3),
    "odobrioId" TEXT,
    "ponistenoAt" TIMESTAMP(3),
    "ponistioId" TEXT,
    "razlogPonistenja" TEXT,
    "ugasenoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gazdinstvo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClanGazdinstva" (
    "id" TEXT NOT NULL,
    "gazdinstvoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uloga" "UlogaUGazdinstvu" NOT NULL DEFAULT 'CLAN',
    "status" "ClanGazdinstvaStatus" NOT NULL DEFAULT 'POZVAN',
    "pozvaoId" TEXT,
    "pozvanAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pristupioAt" TIMESTAMP(3),
    "odobrenAt" TIMESTAMP(3),
    "istupioAt" TIMESTAMP(3),
    "izjavaTekst" TEXT,
    "izjavaAt" TIMESTAMP(3),
    CONSTRAINT "ClanGazdinstva_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DoprinosGazdinstva" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gazdinstvoId" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "redniBroj" INTEGER NOT NULL,
    "iznos" INTEGER NOT NULL,
    "status" "DoprinosStatus" NOT NULL DEFAULT 'ZABELEZEN',
    "transakcijaId" TEXT,
    "zabelezenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidentiranAt" TIMESTAMP(3),
    "obavestenAt" TIMESTAMP(3),
    "ponistenAt" TIMESTAMP(3),
    "otpisanAt" TIMESTAMP(3),
    "otpisTransakcijaId" TEXT,
    CONSTRAINT "DoprinosGazdinstva_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "gazdinstvoId" TEXT;

CREATE INDEX IF NOT EXISTS "Gazdinstvo_status_idx" ON "Gazdinstvo"("status");
CREATE INDEX IF NOT EXISTS "ClanGazdinstva_userId_status_idx" ON "ClanGazdinstva"("userId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "ClanGazdinstva_gazdinstvoId_userId_key" ON "ClanGazdinstva"("gazdinstvoId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DoprinosGazdinstva_userId_key" ON "DoprinosGazdinstva"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DoprinosGazdinstva_clanId_key" ON "DoprinosGazdinstva"("clanId");
CREATE INDEX IF NOT EXISTS "DoprinosGazdinstva_gazdinstvoId_idx" ON "DoprinosGazdinstva"("gazdinstvoId");
CREATE INDEX IF NOT EXISTS "DoprinosGazdinstva_status_idx" ON "DoprinosGazdinstva"("status");

DO $$ BEGIN
  ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_gazdinstvoId_fkey" FOREIGN KEY ("gazdinstvoId") REFERENCES "Gazdinstvo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClanGazdinstva" ADD CONSTRAINT "ClanGazdinstva_gazdinstvoId_fkey" FOREIGN KEY ("gazdinstvoId") REFERENCES "Gazdinstvo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClanGazdinstva" ADD CONSTRAINT "ClanGazdinstva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DoprinosGazdinstva" ADD CONSTRAINT "DoprinosGazdinstva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DoprinosGazdinstva" ADD CONSTRAINT "DoprinosGazdinstva_gazdinstvoId_fkey" FOREIGN KEY ("gazdinstvoId") REFERENCES "Gazdinstvo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DoprinosGazdinstva" ADD CONSTRAINT "DoprinosGazdinstva_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "ClanGazdinstva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
