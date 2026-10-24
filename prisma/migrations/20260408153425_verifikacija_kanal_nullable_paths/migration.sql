-- AlterTable
ALTER TABLE "VerificationRequest" ADD COLUMN     "kanal" TEXT,
ALTER COLUMN "idFrontPath" DROP NOT NULL,
ALTER COLUMN "idBackPath" DROP NOT NULL;
