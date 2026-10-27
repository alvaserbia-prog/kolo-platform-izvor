-- Povlačenje pristanka na prikaz zapisa o poništenju uz vaučer (nabavke 5.0 čl. 33 st. 2).
ALTER TABLE "Vaucer" ADD COLUMN IF NOT EXISTS "pristanakPovucenAt" TIMESTAMP(3);
