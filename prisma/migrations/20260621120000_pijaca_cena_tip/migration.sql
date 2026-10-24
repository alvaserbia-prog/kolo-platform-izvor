-- Tri varijante cene na oglasu Pijace:
--   FIKSNA  → jedan iznos u "price" (kao do sada)
--   RASPON  → "price" = donja granica, "cenaDo" = gornja granica
--   DOGOVOR → bez iznosa („po dogovoru"); price = cenaDo = NULL
-- Postojeći oglasi ostaju FIKSNA (default), pa migracija ne dira njihove iznose.

-- CreateEnum
CREATE TYPE "CenaTip" AS ENUM ('FIKSNA', 'RASPON', 'DOGOVOR');

-- AlterTable
ALTER TABLE "MarketplaceListing"
  ADD COLUMN "cenaTip" "CenaTip" NOT NULL DEFAULT 'FIKSNA',
  ADD COLUMN "cenaDo" INTEGER,
  ALTER COLUMN "price" DROP NOT NULL;
