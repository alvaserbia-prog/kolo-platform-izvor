-- Pravilnik o gazdinstvima čl. 6a st. 2 (set 4.8.3): jedan razgovor — član Kola koji
-- nosioca pozove sa spiska za poziv beleži i razgovor radi odobrenja gazdinstva.
ALTER TABLE "Gazdinstvo" ADD COLUMN "razgovorBeleziId" TEXT;
ALTER TABLE "Gazdinstvo" ADD COLUMN "razgovorSumnja" BOOLEAN;
