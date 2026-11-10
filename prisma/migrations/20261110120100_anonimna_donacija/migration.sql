-- Set 5.1.2 (donacije čl. 12 st. 1): trenutak prevođenja javne donacije u anonimnu.
-- Zatečeni redovi ostaju NULL (bez retroaktivnog popunjavanja).
ALTER TABLE "DonationRecord" ADD COLUMN IF NOT EXISTS "prevedenaUAnonimnuAt" TIMESTAMP(3);
