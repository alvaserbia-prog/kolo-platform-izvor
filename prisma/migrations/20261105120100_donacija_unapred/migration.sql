-- Set 5.0.9: uplata sa računa, potvrda o uplati, donacija unapred, ograničenje primljenog,
-- pokroviteljstvo u narednom obračunskom periodu (donacije čl. 4, 6, 20; Pravilnik čl. 36, 37).
-- CreateEnum
CREATE TYPE "StatusOgranicenja" AS ENUM ('AKTIVNO', 'PRESTALO', 'OTPISANO');

-- AlterTable
ALTER TABLE "DonationRecord" ADD COLUMN     "evidentiranoUnapredAt" TIMESTAMP(3),
ADD COLUMN     "ponistenoAt" TIMESTAMP(3),
ADD COLUMN     "ponistenoById" TEXT,
ADD COLUMN     "ponistenoRazlog" TEXT,
ADD COLUMN     "potvrdaDatum" TIMESTAMP(3),
ADD COLUMN     "potvrdaHash" TEXT,
ADD COLUMN     "potvrdaIznosRSD" DECIMAL(12,2),
ADD COLUMN     "potvrdaPlatilac" TEXT,
ADD COLUMN     "potvrdaPoslataAt" TIMESTAMP(3),
ADD COLUMN     "potvrdaPoziv" TEXT,
ADD COLUMN     "potvrdaRacun" TEXT,
ADD COLUMN     "pozivBroj" SERIAL NOT NULL,
ADD COLUMN     "sumnjaLaznaPotvrda" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unapred" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PokroviteljPrijava" ADD COLUMN     "potvrdaDatum" TIMESTAMP(3),
ADD COLUMN     "potvrdaHash" TEXT,
ADD COLUMN     "potvrdaIznosRSD" DECIMAL(12,2),
ADD COLUMN     "potvrdaPlatilac" TEXT,
ADD COLUMN     "potvrdaPoslataAt" TIMESTAMP(3),
ADD COLUMN     "potvrdaPoziv" TEXT,
ADD COLUMN     "potvrdaRacun" TEXT,
ADD COLUMN     "pozivBroj" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "PokroviteljBonusEmisija" ADD COLUMN     "cekaPeriod" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PotvrdaUplate" (
    "id" TEXT NOT NULL,
    "donationId" TEXT,
    "prijavaId" TEXT,
    "sadrzaj" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "velicina" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PotvrdaUplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OgranicenjePrimljenog" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "primljeno" INTEGER NOT NULL,
    "iznos" INTEGER NOT NULL,
    "rokDo" TIMESTAMP(3) NOT NULL,
    "status" "StatusOgranicenja" NOT NULL DEFAULT 'AKTIVNO',
    "odlukaAt" TIMESTAMP(3),
    "odlukaById" TEXT,
    "otpisano" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OgranicenjePrimljenog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PotvrdaUplate_donationId_key" ON "PotvrdaUplate"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "PotvrdaUplate_prijavaId_key" ON "PotvrdaUplate"("prijavaId");

-- CreateIndex
CREATE INDEX "OgranicenjePrimljenog_walletId_status_idx" ON "OgranicenjePrimljenog"("walletId", "status");

-- CreateIndex
CREATE INDEX "OgranicenjePrimljenog_status_rokDo_idx" ON "OgranicenjePrimljenog"("status", "rokDo");

-- CreateIndex
CREATE UNIQUE INDEX "OgranicenjePrimljenog_donationId_userId_key" ON "OgranicenjePrimljenog"("donationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationRecord_pozivBroj_key" ON "DonationRecord"("pozivBroj");

-- CreateIndex
CREATE UNIQUE INDEX "DonationRecord_potvrdaHash_key" ON "DonationRecord"("potvrdaHash");

-- CreateIndex
CREATE UNIQUE INDEX "PokroviteljPrijava_pozivBroj_key" ON "PokroviteljPrijava"("pozivBroj");

-- CreateIndex
CREATE UNIQUE INDEX "PokroviteljPrijava_potvrdaHash_key" ON "PokroviteljPrijava"("potvrdaHash");

-- AddForeignKey
ALTER TABLE "PotvrdaUplate" ADD CONSTRAINT "PotvrdaUplate_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "DonationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotvrdaUplate" ADD CONSTRAINT "PotvrdaUplate_prijavaId_fkey" FOREIGN KEY ("prijavaId") REFERENCES "PokroviteljPrijava"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OgranicenjePrimljenog" ADD CONSTRAINT "OgranicenjePrimljenog_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "DonationRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

