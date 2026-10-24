-- CreateEnum
CREATE TYPE "ZadrugaStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ZadrugaOsnivanjeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PristupnicaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('PRIKUPLJANJE', 'REDISTRIBUCIJA');

-- CreateTable
CREATE TABLE "Zadruga" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" "ZadrugaStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zadruga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZadrugaMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zadrugaId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ZadrugaMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZadrugaOsnivanjeZahtev" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "inicijatorId" TEXT NOT NULL,
    "osnivaci" TEXT[],
    "status" "ZadrugaOsnivanjeStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZadrugaOsnivanjeZahtev_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZadrugaPristupnica" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zadrugaId" TEXT NOT NULL,
    "status" "PristupnicaStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZadrugaPristupnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZadrugaProject" (
    "id" TEXT NOT NULL,
    "zadrugaId" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZadrugaProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZadrugaBonusLog" (
    "id" TEXT NOT NULL,
    "zadrugaId" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZadrugaBonusLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zadruga_name_key" ON "Zadruga"("name");

-- CreateIndex
CREATE INDEX "ZadrugaMembership_userId_leftAt_idx" ON "ZadrugaMembership"("userId", "leftAt");

-- CreateIndex
CREATE INDEX "ZadrugaMembership_zadrugaId_leftAt_idx" ON "ZadrugaMembership"("zadrugaId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "ZadrugaPristupnica_userId_zadrugaId_key" ON "ZadrugaPristupnica"("userId", "zadrugaId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_zadrugaId_fkey" FOREIGN KEY ("zadrugaId") REFERENCES "Zadruga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadrugaMembership" ADD CONSTRAINT "ZadrugaMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadrugaMembership" ADD CONSTRAINT "ZadrugaMembership_zadrugaId_fkey" FOREIGN KEY ("zadrugaId") REFERENCES "Zadruga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadrugaOsnivanjeZahtev" ADD CONSTRAINT "ZadrugaOsnivanjeZahtev_inicijatorId_fkey" FOREIGN KEY ("inicijatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadrugaPristupnica" ADD CONSTRAINT "ZadrugaPristupnica_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadrugaPristupnica" ADD CONSTRAINT "ZadrugaPristupnica_zadrugaId_fkey" FOREIGN KEY ("zadrugaId") REFERENCES "Zadruga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadrugaProject" ADD CONSTRAINT "ZadrugaProject_zadrugaId_fkey" FOREIGN KEY ("zadrugaId") REFERENCES "Zadruga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadrugaBonusLog" ADD CONSTRAINT "ZadrugaBonusLog_zadrugaId_fkey" FOREIGN KEY ("zadrugaId") REFERENCES "Zadruga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
