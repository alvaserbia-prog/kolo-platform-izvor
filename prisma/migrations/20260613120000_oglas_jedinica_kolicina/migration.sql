-- Opciona jedinica mere (kom, kg, g, l, ml, m, pak) i stanje na zalihama za oglase.
-- Oba su informativna — ne utiču na tok kupovine.
ALTER TABLE "MarketplaceListing" ADD COLUMN "jedinica" TEXT;
ALTER TABLE "MarketplaceListing" ADD COLUMN "kolicina" INTEGER;
