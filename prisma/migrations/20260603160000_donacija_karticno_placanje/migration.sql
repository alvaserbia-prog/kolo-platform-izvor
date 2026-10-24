-- Kartično plaćanje donacija (NestPay: Banca Intesa / OTP)
ALTER TABLE "DonationRecord" ADD COLUMN "nacinUplate" TEXT NOT NULL DEFAULT 'RUCNO';
ALTER TABLE "DonationRecord" ADD COLUMN "provajder" TEXT;
ALTER TABLE "DonationRecord" ADD COLUMN "oid" TEXT;
ALTER TABLE "DonationRecord" ADD COLUMN "bankRef" TEXT;

CREATE UNIQUE INDEX "DonationRecord_oid_key" ON "DonationRecord"("oid");
