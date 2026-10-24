-- CreateEnum
CREATE TYPE "PrigovorStatus" AS ENUM ('PENDING', 'U_OBRADI', 'RESENO', 'ODBIJENO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deaktiviranAt" TIMESTAMP(3),
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PolitikaVerzija" (
    "id" TEXT NOT NULL,
    "verzija" TEXT NOT NULL,
    "naslov" TEXT NOT NULL,
    "efektivnaOd" TIMESTAMP(3) NOT NULL,
    "kreirao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolitikaVerzija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolitikaPrihvatanje" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verzijaId" TEXT NOT NULL,
    "prihvacen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolitikaPrihvatanje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifikacijaPristanak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prihvacenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAdresa" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "VerifikacijaPristanak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrigovorNaOdluku" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opis" TEXT NOT NULL,
    "tipOdluke" TEXT NOT NULL,
    "status" "PrigovorStatus" NOT NULL DEFAULT 'PENDING',
    "odgovor" TEXT,
    "odgovorioId" TEXT,
    "odgovorioAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrigovorNaOdluku_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolitikaVerzija_verzija_key" ON "PolitikaVerzija"("verzija");

-- CreateIndex
CREATE INDEX "PolitikaPrihvatanje_userId_idx" ON "PolitikaPrihvatanje"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PolitikaPrihvatanje_userId_verzijaId_key" ON "PolitikaPrihvatanje"("userId", "verzijaId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifikacijaPristanak_userId_key" ON "VerifikacijaPristanak"("userId");

-- CreateIndex
CREATE INDEX "PrigovorNaOdluku_status_createdAt_idx" ON "PrigovorNaOdluku"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PrigovorNaOdluku_userId_idx" ON "PrigovorNaOdluku"("userId");

-- AddForeignKey
ALTER TABLE "PolitikaPrihvatanje" ADD CONSTRAINT "PolitikaPrihvatanje_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolitikaPrihvatanje" ADD CONSTRAINT "PolitikaPrihvatanje_verzijaId_fkey" FOREIGN KEY ("verzijaId") REFERENCES "PolitikaVerzija"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrigovorNaOdluku" ADD CONSTRAINT "PrigovorNaOdluku_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
