-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('ZAPOSLJAVNJE', 'PODRSKA_MAJKAMA', 'PODRSKA_STARIJIMA', 'POSEBNA_BRIGA', 'SKOLOVANJE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidencijaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EMITTED');

-- CreateTable
CREATE TABLE "BankaProgram" (
    "type" "ProgramType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankaProgram_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "ProgramEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ProgramType" NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "dailyAmount" INTEGER,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "nextReverifikacija" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZaposljvanjeEvidencija" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "EvidencijaStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZaposljvanjeEvidencija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEmissionSummary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "opticaj" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "totalRequested" INTEGER NOT NULL,
    "totalEmitted" INTEGER NOT NULL,
    "koeficijent" DECIMAL(10,6) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyEmissionSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramEnrollment_status_type_idx" ON "ProgramEnrollment"("status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramEnrollment_userId_type_key" ON "ProgramEnrollment"("userId", "type");

-- CreateIndex
CREATE INDEX "ZaposljvanjeEvidencija_date_status_idx" ON "ZaposljvanjeEvidencija"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ZaposljvanjeEvidencija_userId_date_key" ON "ZaposljvanjeEvidencija"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEmissionSummary_date_key" ON "DailyEmissionSummary"("date");

-- AddForeignKey
ALTER TABLE "ProgramEnrollment" ADD CONSTRAINT "ProgramEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZaposljvanjeEvidencija" ADD CONSTRAINT "ZaposljvanjeEvidencija_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZaposljvanjeEvidencija" ADD CONSTRAINT "ZaposljvanjeEvidencija_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
