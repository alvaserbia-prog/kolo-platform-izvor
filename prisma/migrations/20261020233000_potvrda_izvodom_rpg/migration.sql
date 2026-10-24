-- Potvrda stvarnosti izvodom iz Registra poljoprivrednih gazdinstava (dokaz stvarnosti čl. 4a, set 4.8.0).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stvarnostIzRegistraAt" TIMESTAMP(3);
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "rpgUporedjenAt" TIMESTAMP(3);
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "rpgUporedioId" TEXT;
