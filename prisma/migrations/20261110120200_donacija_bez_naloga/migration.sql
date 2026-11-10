-- Set 5.1.2 (donacije čl. 17 st. 4, čl. 25 st. 1): donacija novca pravnog lica bez naloga,
-- bez upisa u evidenciju pokrovitelja i bez POEN-a; prikazuje se na rang-listi pokrovitelja.
CREATE TABLE IF NOT EXISTS "DonacijaBezNaloga" (
    "id" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "iznosRSD" DECIMAL(12,2) NOT NULL,
    "datum" DATE NOT NULL,
    "kreiraoId" TEXT NOT NULL,
    "uklonjenoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonacijaBezNaloga_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DonacijaBezNaloga_uklonjenoAt_idx" ON "DonacijaBezNaloga"("uklonjenoAt");

DO $$ BEGIN
  ALTER TABLE "DonacijaBezNaloga" ADD CONSTRAINT "DonacijaBezNaloga_kreiraoId_fkey"
    FOREIGN KEY ("kreiraoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
