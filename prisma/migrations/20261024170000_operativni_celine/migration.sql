-- Operativni doprinos: zadatak se deli na celine (čl. 5, 6, 18; registar 2026-10, S1).
-- Zatečeni zadaci i izvršenja ostaju NULL (ne popunjavaju se naknadno).
ALTER TABLE "DoprinosOglas" ADD COLUMN "procenaObima" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "opisCeline" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "brojCelina" INTEGER;
ALTER TABLE "OglasEvidencija" ADD COLUMN "celina" INTEGER;
