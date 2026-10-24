-- Moderacija sadržaja: uklanjanje oglasa i poruka iz Pričaonice + prijave korisnika.
-- Osnov: Uslovi korišćenja 4.0.0 čl. 20, 21, 22, 24 i 25.

-- 1. Nov status oglasa
ALTER TYPE "ListingStatus" ADD VALUE 'UKLONJEN';

-- 2. Trag uklanjanja na oglasu
ALTER TABLE "MarketplaceListing"
  ADD COLUMN "uklonjenAt" TIMESTAMP(3),
  ADD COLUMN "uklonjenRazlog" TEXT,
  ADD COLUMN "uklonioId" TEXT;

-- 3. Trag uklanjanja na poruci iz Pričaonice (meko brisanje)
ALTER TABLE "ChatMessage"
  ADD COLUMN "uklonjenoAt" TIMESTAMP(3),
  ADD COLUMN "uklonjenRazlog" TEXT,
  ADD COLUMN "uklonioId" TEXT;

-- 4. Prijave oglasa od korisnika
CREATE TYPE "PrijavaRazlog" AS ENUM ('ZABRANJENO_DOBRO', 'OBMANA', 'UVREDLJIVO', 'LICNI_PODACI', 'PREVARA', 'DRUGO');
CREATE TYPE "PrijavaOglasaStatus" AS ENUM ('OTVORENA', 'RESENA', 'ODBACENA');

CREATE TABLE "PrijavaOglasa" (
    "id" TEXT NOT NULL,
    "oglasId" TEXT NOT NULL,
    "prijaviocId" TEXT NOT NULL,
    "razlog" "PrijavaRazlog" NOT NULL,
    "opis" TEXT,
    "status" "PrijavaOglasaStatus" NOT NULL DEFAULT 'OTVORENA',
    "resioId" TEXT,
    "resenoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrijavaOglasa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrijavaOglasa_oglasId_prijaviocId_key" ON "PrijavaOglasa"("oglasId", "prijaviocId");
CREATE INDEX "PrijavaOglasa_status_createdAt_idx" ON "PrijavaOglasa"("status", "createdAt" DESC);
CREATE INDEX "PrijavaOglasa_oglasId_idx" ON "PrijavaOglasa"("oglasId");

ALTER TABLE "PrijavaOglasa" ADD CONSTRAINT "PrijavaOglasa_oglasId_fkey"
  FOREIGN KEY ("oglasId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrijavaOglasa" ADD CONSTRAINT "PrijavaOglasa_prijaviocId_fkey"
  FOREIGN KEY ("prijaviocId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
