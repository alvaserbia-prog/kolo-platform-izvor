-- Smer oglasa na Pijaci:
--   PONUDA     → oglašivač nudi dobro/uslugu (klasičan oglas, kao do sada)
--   POTRAZNJA  → oglašivač traži nekoga da uradi/napravi nešto („traži se")
-- Postojeći oglasi ostaju PONUDA (default), pa se ništa retroaktivno ne menja.
-- Kod POTRAZNJA je cenaTip uvek DOGOVOR (budžet se dogovara u porukama).

-- CreateEnum
CREATE TYPE "TipOglasa" AS ENUM ('PONUDA', 'POTRAZNJA');

-- AlterTable
ALTER TABLE "MarketplaceListing"
  ADD COLUMN "tip" "TipOglasa" NOT NULL DEFAULT 'PONUDA';

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_tip_createdAt_idx" ON "MarketplaceListing"("status", "tip", "createdAt");
