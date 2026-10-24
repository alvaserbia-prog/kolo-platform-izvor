-- Izjava o poverljivosti pre prvog otvaranja poziva (dokaz stvarnosti čl. 4a; registar 2026-10, S2-M1).
-- Beleži se samo trenutak izjave.
ALTER TABLE "User" ADD COLUMN "poverljivostPozivaAt" TIMESTAMP(3);
