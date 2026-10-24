-- Pravilnik o osnivackom doprinosu v3.9.1: korak 20.000 -> 24.000 POEN,
-- broj koraka 120 -> 100 (poslednji prag 10.000.000). Gornja granica
-- 2.400.000 nepromenjena. Nijedan korak jos nije izvrsen, pa nema
-- istorijskih redova za preracunavanje.
ALTER TABLE "OsnivackiKorakLog" ALTER COLUMN "iznosKoraka" SET DEFAULT 24000;
