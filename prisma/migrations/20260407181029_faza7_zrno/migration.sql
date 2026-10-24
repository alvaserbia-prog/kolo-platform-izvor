-- CreateEnum
CREATE TYPE "ZrnoZahtevStatus" AS ENUM ('PENDING', 'EXECUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ZrnoStatusAkcija" AS ENUM ('ZAKLJUCAJ', 'OTKLJUCAJ');

-- CreateEnum
CREATE TYPE "PredlogStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "ZrnoTrziste" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZrnoTrziste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZrnoStanje" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slobodno" INTEGER NOT NULL DEFAULT 0,
    "aktivno" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZrnoStanje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZrnoKupovinaZahtev" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poenIznos" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "ZrnoZahtevStatus" NOT NULL DEFAULT 'PENDING',
    "zrnaKupljeno" INTEGER,
    "poenPlaceno" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZrnoKupovinaZahtev_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZrnoProdajaZahtev" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kolicina" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "ZrnoZahtevStatus" NOT NULL DEFAULT 'PENDING',
    "poenDobijeno" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZrnoProdajaZahtev_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZrnoStatusZahtev" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kolicina" INTEGER NOT NULL,
    "akcija" "ZrnoStatusAkcija" NOT NULL,
    "date" DATE NOT NULL,
    "status" "ZrnoZahtevStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZrnoStatusZahtev_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZrnoDailyRate" (
    "date" DATE NOT NULL,
    "kurs" DECIMAL(20,2) NOT NULL,
    "bankaMinus" INTEGER NOT NULL,
    "zrnaUBanci" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ZrnoDelegacija" (
    "id" TEXT NOT NULL,
    "delegatorId" TEXT NOT NULL,
    "delegatId" TEXT NOT NULL,
    "aktivna" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZrnoDelegacija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlasanjePredlog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "PredlogStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlasanjePredlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlasanjeGlas" (
    "id" TEXT NOT NULL,
    "predlogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "za" BOOLEAN NOT NULL,
    "glasackaGlasova" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlasanjeGlas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZrnoStanje_userId_key" ON "ZrnoStanje"("userId");

-- CreateIndex
CREATE INDEX "ZrnoKupovinaZahtev_date_status_idx" ON "ZrnoKupovinaZahtev"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ZrnoKupovinaZahtev_userId_date_key" ON "ZrnoKupovinaZahtev"("userId", "date");

-- CreateIndex
CREATE INDEX "ZrnoProdajaZahtev_date_status_idx" ON "ZrnoProdajaZahtev"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ZrnoProdajaZahtev_userId_date_key" ON "ZrnoProdajaZahtev"("userId", "date");

-- CreateIndex
CREATE INDEX "ZrnoStatusZahtev_date_status_idx" ON "ZrnoStatusZahtev"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ZrnoDailyRate_date_key" ON "ZrnoDailyRate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ZrnoDelegacija_delegatorId_key" ON "ZrnoDelegacija"("delegatorId");

-- CreateIndex
CREATE INDEX "GlasanjeGlas_predlogId_idx" ON "GlasanjeGlas"("predlogId");

-- CreateIndex
CREATE UNIQUE INDEX "GlasanjeGlas_predlogId_userId_key" ON "GlasanjeGlas"("predlogId", "userId");

-- AddForeignKey
ALTER TABLE "ZrnoStanje" ADD CONSTRAINT "ZrnoStanje_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZrnoKupovinaZahtev" ADD CONSTRAINT "ZrnoKupovinaZahtev_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZrnoProdajaZahtev" ADD CONSTRAINT "ZrnoProdajaZahtev_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZrnoStatusZahtev" ADD CONSTRAINT "ZrnoStatusZahtev_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZrnoDelegacija" ADD CONSTRAINT "ZrnoDelegacija_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZrnoDelegacija" ADD CONSTRAINT "ZrnoDelegacija_delegatId_fkey" FOREIGN KEY ("delegatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasanjePredlog" ADD CONSTRAINT "GlasanjePredlog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasanjeGlas" ADD CONSTRAINT "GlasanjeGlas_predlogId_fkey" FOREIGN KEY ("predlogId") REFERENCES "GlasanjePredlog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasanjeGlas" ADD CONSTRAINT "GlasanjeGlas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
