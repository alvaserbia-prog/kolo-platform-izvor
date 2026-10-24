-- Redizajn table jemstva: kartica prepoznavanja + feed prepoznavanja.
--
-- Migracija je ADITIVNA i povratna: sva nova polja su nullable, nijedna
-- postojeća kolona se ne briše. `tekstPredstavljanja` i `kontaktPodaci` ostaju
-- u bazi (samo postaju nullable) jedan ciklus, da povratak na prethodnu verziju
-- ne izgubi podatke. Povratak zahteva jedino da se nove kartice popune praznim
-- tekstom pre vraćanja NOT NULL ograničenja.

-- ── 1. Novi status: legacy objava sa slobodnim tekstom ───────────────────────
ALTER TYPE "JemstvoStatus" ADD VALUE IF NOT EXISTS 'NEPOTPUN';

-- ── 2. Odgovor u feed-u prepoznavanja ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PrepoznavanjeOdgovor') THEN
    CREATE TYPE "PrepoznavanjeOdgovor" AS ENUM ('DA', 'NE', 'NISAM_SIGURAN');
  END IF;
END$$;

-- ── 3. Polja kartice prepoznavanja ───────────────────────────────────────────
ALTER TABLE "ZahtevZaJemstvo"
  ADD COLUMN IF NOT EXISTS "ime"               TEXT,
  ADD COLUMN IF NOT EXISTS "prezime"           TEXT,
  ADD COLUMN IF NOT EXISTS "godiste"           INTEGER,
  ADD COLUMN IF NOT EXISTS "mesto"             TEXT,
  ADD COLUMN IF NOT EXISTS "nadimak"           TEXT,
  ADD COLUMN IF NOT EXISTS "cimeSeBavi"        TEXT,
  ADD COLUMN IF NOT EXISTS "telefon"           TEXT,
  ADD COLUMN IF NOT EXISTS "telefonSaglasnost" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "linkProfila"       TEXT,
  ADD COLUMN IF NOT EXISTS "legacyTekst"       TEXT;

-- ── 4. Stara polja postaju opciona (nove kartice ih ne popunjavaju) ──────────
ALTER TABLE "ZahtevZaJemstvo" ALTER COLUMN "tekstPredstavljanja" DROP NOT NULL;
ALTER TABLE "ZahtevZaJemstvo" ALTER COLUMN "kontaktPodaci"       DROP NOT NULL;

-- ── 5. Indeks za feed (kandidati iz istog mesta) ─────────────────────────────
CREATE INDEX IF NOT EXISTS "ZahtevZaJemstvo_status_mesto_idx"
  ON "ZahtevZaJemstvo" ("status", "mesto");

-- ── 6. Tabela odgovora „Poznaješ li ovu osobu?" ──────────────────────────────
CREATE TABLE IF NOT EXISTS "Prepoznavanje" (
  "id"         TEXT NOT NULL,
  "zahtevId"   TEXT NOT NULL,
  "korisnikId" TEXT NOT NULL,
  "odgovor"    "PrepoznavanjeOdgovor" NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Prepoznavanje_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Prepoznavanje_zahtevId_korisnikId_key"
  ON "Prepoznavanje" ("zahtevId", "korisnikId");
CREATE INDEX IF NOT EXISTS "Prepoznavanje_korisnikId_idx"
  ON "Prepoznavanje" ("korisnikId");

ALTER TABLE "Prepoznavanje"
  DROP CONSTRAINT IF EXISTS "Prepoznavanje_zahtevId_fkey";
ALTER TABLE "Prepoznavanje"
  ADD CONSTRAINT "Prepoznavanje_zahtevId_fkey"
  FOREIGN KEY ("zahtevId") REFERENCES "ZahtevZaJemstvo"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Prepoznavanje"
  DROP CONSTRAINT IF EXISTS "Prepoznavanje_korisnikId_fkey";
ALTER TABLE "Prepoznavanje"
  ADD CONSTRAINT "Prepoznavanje_korisnikId_fkey"
  FOREIGN KEY ("korisnikId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
