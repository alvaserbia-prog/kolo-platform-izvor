-- Preimenovanje kolona ZrnoDailyRate posle banka -> protokol migracije
ALTER TABLE "ZrnoDailyRate" RENAME COLUMN "bankaMinus" TO "protokolMinus";
ALTER TABLE "ZrnoDailyRate" RENAME COLUMN "zrnaUBanci" TO "zrnaUProtokolu";
