-- Povlačenje pristanka na objavljivanje imena uz javnu donaciju (Pravilnik o
-- pokroviteljstvu i donacijama čl. 5a st. 4, set 4.6.8). Trenutak kada je ime
-- uklonjeno iz liste — povlačenjem ili prestankom svojstva korisnika. Zatečeni
-- redovi ostaju NULL.
ALTER TABLE "DonationRecord" ADD COLUMN IF NOT EXISTS "imePovucenoAt" TIMESTAMP(3);
