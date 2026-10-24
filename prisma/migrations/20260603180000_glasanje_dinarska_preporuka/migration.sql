-- D5 (Gornje Kolo 3.7.6, čl. 20): dinarske preporuke i obrazložen odgovor UO.
-- Predlog moze biti obavezujuca ODLUKA ili neobavezujuca DINARSKA_PREPORUKA.
-- Na usvojenu preporuku UO daje obrazlozen odgovor (PRIHVACENO/ODBIJENO).
CREATE TYPE "PredlogVrsta" AS ENUM ('ODLUKA', 'DINARSKA_PREPORUKA');
CREATE TYPE "UoOdgovor" AS ENUM ('PRIHVACENO', 'ODBIJENO');

ALTER TABLE "GlasanjePredlog" ADD COLUMN "vrsta" "PredlogVrsta" NOT NULL DEFAULT 'ODLUKA';
ALTER TABLE "GlasanjePredlog" ADD COLUMN "uoOdgovor" "UoOdgovor";
ALTER TABLE "GlasanjePredlog" ADD COLUMN "uoObrazlozenje" TEXT;
ALTER TABLE "GlasanjePredlog" ADD COLUMN "uoOdgovorAt" TIMESTAMP(3);
