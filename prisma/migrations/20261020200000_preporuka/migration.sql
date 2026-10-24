-- Preporuka člana (Uslovi korišćenja čl. 17a, Registar radnji obrade br. 23,
-- set 4.8.0; odluka vlasnika 20.10.2026). Jedan red po paru (ko → koga), bez
-- teksta i ocene. Brisanje naloga briše i preporuke koje je dao i koje je primio.
--
-- Idempotentno (P3009 pouka): ponovno izvršavanje ne pada.

CREATE TABLE IF NOT EXISTS "Preporuka" (
    "id" TEXT NOT NULL,
    "odId" TEXT NOT NULL,
    "zaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Preporuka_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Preporuka_odId_zaId_key" ON "Preporuka"("odId", "zaId");
CREATE INDEX IF NOT EXISTS "Preporuka_zaId_idx" ON "Preporuka"("zaId");

DO $$ BEGIN
  ALTER TABLE "Preporuka" ADD CONSTRAINT "Preporuka_odId_fkey" FOREIGN KEY ("odId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Preporuka" ADD CONSTRAINT "Preporuka_zaId_fkey" FOREIGN KEY ("zaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
