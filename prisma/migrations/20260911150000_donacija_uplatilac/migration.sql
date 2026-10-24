-- Uplatilac iz bankovnog izvoda i oznaka stranog priliva
-- (Pravilnik o pokroviteljstvu i donacijama 4.5.5, cl. 3 i glava IV).
--
-- Zatecene donacije ostaju bez uplatioca (NULL) — za njih taj podatak nije ni
-- prikupljan, a retroaktivno upisano ime bilo bi tvrdnja koja nije proverena.
ALTER TABLE "DonationRecord" ADD COLUMN "uplatilac" TEXT;
ALTER TABLE "DonationRecord" ADD COLUMN "straniPriliv" BOOLEAN NOT NULL DEFAULT false;
