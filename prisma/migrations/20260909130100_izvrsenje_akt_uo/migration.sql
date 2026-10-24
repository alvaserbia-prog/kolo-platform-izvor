-- Sprovođenje odluke Gornjeg Kola aktom Upravnog odbora (čl. 51 Pravilnika, set 4.4.6).
-- Do sada je izvršenje bilo samo status i datum, pa se iz registra nije videlo da je
-- nadležni organ išta doneo. Odbijanje je moguće samo iz razloga sa zatvorene liste.
CREATE TYPE "OdbijanjeRazlog" AS ENUM ('ZAKON', 'STATUT', 'VAN_NADLEZNOSTI');

ALTER TABLE "GlasanjePredlog"
  ADD COLUMN "izvrsenjeAkt" TEXT,
  ADD COLUMN "odbijanjeRazlog" "OdbijanjeRazlog",
  ADD COLUMN "odbijanjeObrazlozenje" TEXT,
  ADD COLUMN "odbijanjeAt" TIMESTAMP(3);
