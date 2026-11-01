-- Set 5.0.2: hrana u pokroviteljstvu dobrima (donacije čl. 28 st. 2 t. 6 i st. 3).
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "vrstaHrane" "VrstaHrane";
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "porekloHrane" "PorekloHrane";
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "obimProizvodnje" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "izjavaPoreklaAt" TIMESTAMP(3);
