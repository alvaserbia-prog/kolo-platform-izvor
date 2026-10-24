-- Modul Zadruga: krug i zadruga su isti kolektivni oblik (Pravilnik o zadrugama
-- čl. 11), pa zadruga živi u tabeli "Krug" sa podacima o upisu i ugovoru.
ALTER TABLE "Krug" ADD COLUMN IF NOT EXISTS "zadruga" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Krug" ADD COLUMN IF NOT EXISTS "maticniBroj" TEXT;
ALTER TABLE "Krug" ADD COLUMN IF NOT EXISTS "pib" TEXT;
ALTER TABLE "Krug" ADD COLUMN IF NOT EXISTS "adresa" TEXT;
ALTER TABLE "Krug" ADD COLUMN IF NOT EXISTS "ugovorAt" TIMESTAMP(3);
ALTER TABLE "Krug" ADD COLUMN IF NOT EXISTS "prestanakAt" TIMESTAMP(3);

-- Ime i prezime zadrugara (Registar radnji obrade br. 19) — samo uz pristanak.
ALTER TABLE "KrugClanstvo" ADD COLUMN IF NOT EXISTS "imePrezime" TEXT;
ALTER TABLE "KrugClanstvo" ADD COLUMN IF NOT EXISTS "pristanakAt" TIMESTAMP(3);
