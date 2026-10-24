-- Ugovor o donaciji (Pravilnik o pokroviteljstvu i donacijama, cl. 5b).
-- Snimljen tekst u trenutku potvrde donacije; zatecene donacije ostaju NULL
-- (za njih ugovor nije ni sacinjen) i to je namerno.
ALTER TABLE "DonationRecord" ADD COLUMN "ugovorTekst" TEXT;
