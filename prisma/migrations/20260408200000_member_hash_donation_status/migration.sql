-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- AlterTable: Add memberHash with a temporary default, backfill, then add unique constraint
ALTER TABLE "User" ADD COLUMN "memberHash" TEXT;

-- Backfill existing users with generated hashes (8-char alphanumeric)
UPDATE "User"
SET "memberHash" = SUBSTRING(MD5(id::text || RANDOM()::text), 1, 8)
WHERE "memberHash" IS NULL;

-- Make NOT NULL and add unique constraint
ALTER TABLE "User" ALTER COLUMN "memberHash" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_memberHash_key" UNIQUE ("memberHash");

-- AlterTable: Add new columns to DonationRecord
ALTER TABLE "DonationRecord"
  ADD COLUMN "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "referenceNumber" TEXT,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "confirmedById" TEXT;

-- CreateIndex
CREATE INDEX "DonationRecord_status_createdAt_idx" ON "DonationRecord"("status", "createdAt");
