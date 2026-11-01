-- Više mesta: oglas na Pijaci (do tri mesta) i ugovor o dobrima i uslugama
-- (više mesta predaje, odnosno pružanja; donacije čl. 28 st. 2 t. 5, set 5.0.6).
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "dodatnaMesta" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "dodatnaMestaPredaje" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "dodatneAdresePredaje" TEXT[] DEFAULT ARRAY[]::TEXT[];
