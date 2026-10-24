-- Izjava izvršioca uz prijavu na zadatak operativnog doprinosa (čl. 10 al. 3
-- Pravilnika o operativnom doprinosu, set 4.4.4).
--
-- Zatečene prijave OSTAJU bez izjave (NULL) — za njih izjava nije ni data, a
-- retroaktivno upisana izjava sa današnjim datumom bila bi netačan dokument.
-- Isti postupak kao sa zatečenim donacijama bez ugovora (`ugovorTekst`).
ALTER TABLE "OglasPrijava" ADD COLUMN "izjavaTekst" TEXT;
ALTER TABLE "OglasPrijava" ADD COLUMN "izjavaAt" TIMESTAMP(3);
