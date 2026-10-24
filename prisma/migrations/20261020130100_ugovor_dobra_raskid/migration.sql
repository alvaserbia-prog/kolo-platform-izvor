-- Raskid ugovora po neizvršenju (donacije čl. 13j st. 1 i 2, set 4.7.8).
ALTER TABLE "UgovorDobra" ADD COLUMN "raskinutoAt" TIMESTAMP(3);
ALTER TABLE "UgovorDobra" ADD COLUMN "raskidObrazlozenje" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN "raskinuoId" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN "raskidOtpis" INTEGER;
ALTER TABLE "UgovorDobra" ADD COLUMN "raskidOtpisTxId" TEXT;

-- Zabrana novog ugovora 12 meseci od raskida traži poslednji raskid po davaocu.
CREATE INDEX "UgovorDobra_status_raskinutoAt_idx" ON "UgovorDobra"("status", "raskinutoAt");
