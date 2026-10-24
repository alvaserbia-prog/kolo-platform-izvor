-- Operativni doprinos: prelazak sa modela satnice na model predloženog POEN-a
-- (Pravilnik o operativnom doprinosu čl. 5, 6, 11, 14, 18, 22–25).
--
-- Predloženi POEN je težinski koeficijent (nije garantovani iznos). Evidentiranje
-- se vrši na kraju obračunskog perioda kroz raspodelu dnevnog limita po formuli
-- evidentirani = predloženi × min(1, L/P). Verifikacija izvršenja više ne emituje
-- POEN odmah, već samo potvrđuje dnevno izvršenje (status APPROVED), koje ulazi u
-- noćnu raspodelu.
--
-- Konsolidacija: stari paralelni PED tok (model "DoprinosEvidencija" + enrollment
-- tipa PED) se uklanja — operativni doprinos sada u celosti ide kroz oglase.

-- 1. Uklanjanje starog PED toka (evidencija vezana za ProgramEnrollment)
DROP TABLE IF EXISTS "DoprinosEvidencija";

-- 2. DoprinosOglas: satnica → predloženi POEN
ALTER TABLE "DoprinosOglas" DROP COLUMN IF EXISTS "hourlyRate";
ALTER TABLE "DoprinosOglas" DROP COLUMN IF EXISTS "maxHoursPerDay";
ALTER TABLE "DoprinosOglas" ADD COLUMN "predlozeniPoen" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DoprinosOglas" ALTER COLUMN "predlozeniPoen" DROP DEFAULT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "obrazlozenje" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "saOdobravanjem" BOOLEAN NOT NULL DEFAULT false;

-- 3. OglasPrijava: plan izvršenja (čl. 11)
ALTER TABLE "OglasPrijava" ADD COLUMN "planIzvrsenja" TEXT;

-- 4. OglasEvidencija: sati → predloženi POEN; amount postaje evidentirano (0 dok nije obračunato)
ALTER TABLE "OglasEvidencija" DROP COLUMN IF EXISTS "hoursWorked";
ALTER TABLE "OglasEvidencija" ADD COLUMN "predlozeniPoen" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OglasEvidencija" ALTER COLUMN "predlozeniPoen" DROP DEFAULT;
ALTER TABLE "OglasEvidencija" ADD COLUMN "dokaz" TEXT;
ALTER TABLE "OglasEvidencija" ALTER COLUMN "amount" SET DEFAULT 0;

-- 5. Indeks za noćnu raspodelu (sve potvrđene verifikacije — status APPROVED)
CREATE INDEX "OglasEvidencija_status_idx" ON "OglasEvidencija"("status");
