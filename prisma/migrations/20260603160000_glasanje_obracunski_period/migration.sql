-- D1 (Gornje Kolo 3.7.6): glasanje vezano za obračunski period + utvrđivanje ishoda.
-- Predlog otvoren u periodu N glasa se u N+1 (glasanjePocetak) i zatvara na kraju
-- tog perioda (deadline). Ishod (prosta većina) i zbirovi moći se beleže pri zatvaranju.
ALTER TABLE "GlasanjePredlog" ADD COLUMN "glasanjePocetak" TIMESTAMP(3);
UPDATE "GlasanjePredlog" SET "glasanjePocetak" = "createdAt" WHERE "glasanjePocetak" IS NULL;
ALTER TABLE "GlasanjePredlog" ALTER COLUMN "glasanjePocetak" SET NOT NULL;
ALTER TABLE "GlasanjePredlog" ADD COLUMN "ishodUsvojen" BOOLEAN;
ALTER TABLE "GlasanjePredlog" ADD COLUMN "zaZbir" INTEGER;
ALTER TABLE "GlasanjePredlog" ADD COLUMN "protivZbir" INTEGER;
