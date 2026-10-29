-- Pričaonica: autor menja i briše sopstvenu poruku (odluka vlasnika 28.10.2026).
-- Čuva se samo trenutak poslednje izmene, bez ranijih verzija teksta.
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "izmenjenoAt" TIMESTAMP(3);
