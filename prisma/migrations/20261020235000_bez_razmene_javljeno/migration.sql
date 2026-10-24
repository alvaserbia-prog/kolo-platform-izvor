-- Obaveštenje verifikatoru da potvrđeni 30 dana nema razmenu (nadzor integriteta, set 4.8.0).
ALTER TABLE "VerifikacionaVeza" ADD COLUMN IF NOT EXISTS "bezRazmeneJavljenoAt" TIMESTAMP(3);
