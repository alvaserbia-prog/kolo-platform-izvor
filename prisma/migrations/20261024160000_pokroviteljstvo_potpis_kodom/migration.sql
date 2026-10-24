-- Registar rizika 2026-10, F5-M1: novčano pokroviteljstvo se potpisuje jednokratnim kodom (donacije čl. 8, 13g).
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "kontrolniBroj" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "potpisKodHash" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "potpisKodIstice" TIMESTAMP(3);
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "potpisKodPokusaja" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "potpisKodPoslatAt" TIMESTAMP(3);
