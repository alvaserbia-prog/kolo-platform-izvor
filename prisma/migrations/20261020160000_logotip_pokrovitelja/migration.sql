-- Logotip pokrovitelja (Pravilnik o pokroviteljstvu i donacijama čl. 13 st. 4,
-- set 4.7.8): javni URL slike na R2, deo evidencije pokrovitelja. Nije obavezan.
-- Samo dodavanje kolona; zatečeni redovi ostaju NULL.
ALTER TABLE "Pokrovitelj" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
