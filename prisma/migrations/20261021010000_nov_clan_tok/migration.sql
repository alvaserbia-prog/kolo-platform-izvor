-- Tok članstva novog člana (set 4.8.1): zahtev za razgovor, oznaka potvrde po
-- pozivu, ko je otvorio razgovor (dnevni limit), telefon i razgovor sa članom
-- gazdinstva pre odobrenja.
ALTER TABLE "Konverzacija" ADD COLUMN IF NOT EXISTS "pokrenuoId" TEXT;
ALTER TABLE "VerifikacionaVeza" ADD COLUMN IF NOT EXISTS "poPozivu" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ClanGazdinstva" ADD COLUMN IF NOT EXISTS "telefon" TEXT;
ALTER TABLE "ClanGazdinstva" ADD COLUMN IF NOT EXISTS "razgovorObavljenAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ZahtevZaRazgovor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mesto" TEXT NOT NULL,
    "opis" TEXT NOT NULL,
    "dostupnost" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "pristanakTekst" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otvorioId" TEXT,
    "otvorenDo" TIMESTAMP(3),
    CONSTRAINT "ZahtevZaRazgovor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ZahtevZaRazgovor_userId_key" ON "ZahtevZaRazgovor"("userId");
CREATE INDEX IF NOT EXISTS "ZahtevZaRazgovor_otvorioId_idx" ON "ZahtevZaRazgovor"("otvorioId");
DO $$ BEGIN
  ALTER TABLE "ZahtevZaRazgovor" ADD CONSTRAINT "ZahtevZaRazgovor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
