-- Prijava pokroviteljstva: matični broj, adresa sedišta, zastupnik i trag
-- poređenja sa APR-om (Pravilnik o pokroviteljstvu i donacijama čl. 7, set 4.7.3).
-- Zatečeni redovi ostaju NULL.
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "maticniBroj" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "adresaSedista" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "zastupnikImePrezime" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "zastupnikFunkcija" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "aprUporedjenAt" TIMESTAMP(3);
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "aprUporedioId" TEXT;
ALTER TABLE "Pokrovitelj" ADD COLUMN IF NOT EXISTS "maticniBroj" TEXT;
