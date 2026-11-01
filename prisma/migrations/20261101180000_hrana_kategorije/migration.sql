-- Set 5.0.5: kategorizacija hrane iz odgovora (donacije čl. 22 st. 4–8) i potpis podnosioca
-- pri podnošenju prijave (čl. 31–32).
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "hranaOdgovori" JSONB;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "hranaKategorija" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "hranaKoeficijent" DECIMAL(4,2);
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "podnosilacPotpisaoAt" TIMESTAMP(3);
