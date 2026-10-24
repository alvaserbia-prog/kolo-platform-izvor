-- Oznaka verifikatora (dopuna 3.9.1): slobodan nadimak koji verifikator dodeljuje
-- verifikovanome radi lakšeg praćenja sopstvenog lanca jemstva. Vidljiva isključivo
-- verifikatoru i UO Fondacije (admin); nije javna i ne objavljuje se drugim korisnicima.
ALTER TABLE "VerifikacionaVeza" ADD COLUMN "oznakaVerifikatora" TEXT;
