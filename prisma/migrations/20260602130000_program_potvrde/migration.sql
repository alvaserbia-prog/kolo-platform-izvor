-- Verifikatorska potvrda socijalnih programa (anti-malverzacija).
-- Prijava na socijalni program zahteva indeks 100% (10 verifikacija) i izričit
-- pristanak; svih 10 verifikatora potvrđuje ispunjenost uslova pod punom
-- odgovornošću (bez uvida u osetljive podatke). Odbijanje traži obrazloženje.

-- CreateEnum
CREATE TYPE "PotvrdaStatus" AS ENUM ('CEKA', 'POTVRDJENO', 'ODBIJENO');

-- AlterTable
ALTER TABLE "ProgramEnrollment" ADD COLUMN "pristanakVerifikatori" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProgramPotvrda" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "verifikatorId" TEXT NOT NULL,
    "status" "PotvrdaStatus" NOT NULL DEFAULT 'CEKA',
    "obrazlozenje" TEXT,
    "odgovorAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramPotvrda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramPotvrda_enrollmentId_verifikatorId_key" ON "ProgramPotvrda"("enrollmentId", "verifikatorId");

-- CreateIndex
CREATE INDEX "ProgramPotvrda_verifikatorId_status_idx" ON "ProgramPotvrda"("verifikatorId", "status");

-- AddForeignKey
ALTER TABLE "ProgramPotvrda" ADD CONSTRAINT "ProgramPotvrda_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramPotvrda" ADD CONSTRAINT "ProgramPotvrda_verifikatorId_fkey" FOREIGN KEY ("verifikatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
