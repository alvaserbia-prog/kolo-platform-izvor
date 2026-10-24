-- Knjigovodstvena isprava uz prijavu pokroviteljstva robom ili uslugama
-- (Pravilnik o pokroviteljstvu i donacijama, cl. 7). Zatecene prijave ostaju
-- NULL — za njih isprava nije ni trazena.
ALTER TABLE "PokroviteljPrijava" ADD COLUMN "ispravaSlika" TEXT;
