-- Set 5.1.3: priprema pokroviteljstva nastavlja prihvatanje od mesta gde je stala, priprema
-- prijave iz postojećeg upisa, tačke mesta predaje i STIPS bilteni sa cenama pijaca.
ALTER TABLE "PripremaPokroviteljstva" ALTER COLUMN "upisPodaci" DROP NOT NULL;
ALTER TABLE "PripremaPokroviteljstva" ALTER COLUMN "mapaMesto" DROP NOT NULL;
ALTER TABLE "PripremaPokroviteljstva" ADD COLUMN IF NOT EXISTS "postojeciUpisId" TEXT;
ALTER TABLE "PripremaPokroviteljstva" ADD COLUMN IF NOT EXISTS "prihvatanjeAt" TIMESTAMP(3);
ALTER TABLE "PripremaPokroviteljstva" ADD COLUMN IF NOT EXISTS "odobrenoAt" TIMESTAMP(3);
-- Zatečene prihvaćene pripreme su prošle sve korake (odobrenje je išlo odmah posle upisa).
UPDATE "PripremaPokroviteljstva" SET "odobrenoAt" = "prihvacenoAt"
  WHERE "prihvacenoAt" IS NOT NULL AND "upisId" IS NOT NULL AND "odobrenoAt" IS NULL;

ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "stipsBiltenId" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "stipsBiltenBroj" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "stipsBiltenUrl" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "stipsJedinica" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "stipsPijace" JSONB;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "tackePredaje" JSONB;

CREATE TABLE IF NOT EXISTS "StipsBilten" (
    "id" TEXT NOT NULL,
    "vrsta" TEXT NOT NULL,
    "broj" TEXT NOT NULL,
    "datumObjave" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "pronadjenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StipsBilten_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StipsBilten_vrsta_broj_key" ON "StipsBilten"("vrsta", "broj");
CREATE INDEX IF NOT EXISTS "StipsBilten_datumObjave_idx" ON "StipsBilten"("datumObjave");

CREATE TABLE IF NOT EXISTS "StipsCena" (
    "id" TEXT NOT NULL,
    "biltenId" TEXT NOT NULL,
    "kategorija" TEXT NOT NULL,
    "jedinica" TEXT NOT NULL,
    "pijaca" TEXT NOT NULL,
    "cena" DECIMAL(12,2) NOT NULL,
    "uneoId" TEXT NOT NULL,
    "unetoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StipsCena_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StipsCena_biltenId_kategorija_pijaca_key" ON "StipsCena"("biltenId", "kategorija", "pijaca");
CREATE INDEX IF NOT EXISTS "StipsCena_kategorija_idx" ON "StipsCena"("kategorija");
DO $$ BEGIN
  ALTER TABLE "StipsCena" ADD CONSTRAINT "StipsCena_biltenId_fkey" FOREIGN KEY ("biltenId") REFERENCES "StipsBilten"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
