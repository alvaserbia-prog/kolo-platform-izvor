-- Brojač pregleda oglasa (vidi ga samo oglašivač).
ALTER TABLE "MarketplaceListing" ADD COLUMN "pregledi" INTEGER NOT NULL DEFAULT 0;
