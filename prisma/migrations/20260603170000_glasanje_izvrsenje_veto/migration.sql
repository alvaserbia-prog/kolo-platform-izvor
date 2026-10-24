-- D4 (Gornje Kolo 3.7.6, čl. 17, 18): izvršenje usvojenih odluka i zaštitni veto.
-- Usvojena odluka prelazi u ZA_IZVRSENJE; Fondacija je izvršava (IZVRSENO) ili
-- obrazloženim vetom obustavlja izvršenje (VETO_OBUSTAVLJENO).
CREATE TYPE "IzvrsenjeStatus" AS ENUM ('ZA_IZVRSENJE', 'IZVRSENO', 'VETO_OBUSTAVLJENO');

ALTER TABLE "GlasanjePredlog" ADD COLUMN "izvrsenjeStatus" "IzvrsenjeStatus";
ALTER TABLE "GlasanjePredlog" ADD COLUMN "vetoObrazlozenje" TEXT;
ALTER TABLE "GlasanjePredlog" ADD COLUMN "izvrsenoAt" TIMESTAMP(3);
ALTER TABLE "GlasanjePredlog" ADD COLUMN "vetoAt" TIMESTAMP(3);

-- Postojeće usvojene (zatvorene, ishodUsvojen=true) odluke prelaze u ZA_IZVRSENJE.
UPDATE "GlasanjePredlog" SET "izvrsenjeStatus" = 'ZA_IZVRSENJE'
WHERE "status" = 'CLOSED' AND "ishodUsvojen" = true;
