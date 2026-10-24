-- CreateEnum
CREATE TYPE "OglasStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE "OglasSource" AS ENUM ('FONDACIJA', 'ZADRUGA', 'PROJEKAT');
CREATE TYPE "RadnaPrijavaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable RadniOglas
CREATE TABLE "RadniOglas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" "OglasSource" NOT NULL,
    "hourlyRate" INTEGER NOT NULL,
    "maxHoursPerDay" INTEGER NOT NULL DEFAULT 8,
    "positions" INTEGER NOT NULL DEFAULT 1,
    "deadline" TIMESTAMP(3),
    "status" "OglasStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "zadrugaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RadniOglas_pkey" PRIMARY KEY ("id")
);

-- CreateTable RadniOglasPrijava
CREATE TABLE "RadniOglasPrijava" (
    "id" TEXT NOT NULL,
    "oglasId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RadnaPrijavaStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RadniOglasPrijava_pkey" PRIMARY KEY ("id")
);

-- CreateTable RadnaEvidencija
CREATE TABLE "RadnaEvidencija" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oglasId" TEXT NOT NULL,
    "prijavaId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hoursWorked" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EvidencijaStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RadnaEvidencija_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RadniOglas_status_createdAt_idx" ON "RadniOglas"("status", "createdAt" DESC);
CREATE UNIQUE INDEX "RadniOglasPrijava_oglasId_userId_key" ON "RadniOglasPrijava"("oglasId", "userId");
CREATE INDEX "RadniOglasPrijava_status_oglasId_idx" ON "RadniOglasPrijava"("status", "oglasId");
CREATE UNIQUE INDEX "RadnaEvidencija_userId_oglasId_date_key" ON "RadnaEvidencija"("userId", "oglasId", "date");
CREATE INDEX "RadnaEvidencija_date_status_idx" ON "RadnaEvidencija"("date", "status");

-- AddForeignKey
ALTER TABLE "RadniOglas" ADD CONSTRAINT "RadniOglas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RadniOglas" ADD CONSTRAINT "RadniOglas_zadrugaId_fkey" FOREIGN KEY ("zadrugaId") REFERENCES "Zadruga"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RadniOglasPrijava" ADD CONSTRAINT "RadniOglasPrijava_oglasId_fkey" FOREIGN KEY ("oglasId") REFERENCES "RadniOglas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RadniOglasPrijava" ADD CONSTRAINT "RadniOglasPrijava_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RadnaEvidencija" ADD CONSTRAINT "RadnaEvidencija_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RadnaEvidencija" ADD CONSTRAINT "RadnaEvidencija_oglasId_fkey" FOREIGN KEY ("oglasId") REFERENCES "RadniOglas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RadnaEvidencija" ADD CONSTRAINT "RadnaEvidencija_prijavaId_fkey" FOREIGN KEY ("prijavaId") REFERENCES "RadniOglasPrijava"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
