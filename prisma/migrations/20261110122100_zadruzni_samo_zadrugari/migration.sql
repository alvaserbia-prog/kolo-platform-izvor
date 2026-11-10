-- Operativni čl. 9 st. 3, 23 st. 2; zadruge čl. 17 st. 2 (set 5.1.2): zadruga sme
-- obrazloženim kvalifikacionim uslovom ograničiti prijavu za svoju celinu na svoje
-- zadrugare. Izvršioca više niko ne dodeljuje. Zatečeni redovi dobijaju false.
ALTER TABLE "DoprinosOglas" ADD COLUMN IF NOT EXISTS "samoZadrugari" BOOLEAN NOT NULL DEFAULT false;
