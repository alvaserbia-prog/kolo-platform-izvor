-- R-07 (nelojalna i obmanjujuća poslovna praksa) — trgovinski rečnik izlazi iz šeme.
--
-- 🔴 Isključivo RENAME. Nijedan red se ne menja, nijedan podatak se ne gubi.
-- Isti postupak kao `20260913130000_zrno_bez_trzista_i_kursa` (R-04): repo je javan
-- pod AGPL, pa je `schema.prisma` prvi dokument koji ozbiljan čitalac otvori. Uslovi
-- čl. 22 kažu da Fondacija nije strana u razmeni i da razmena nije kupoprodaja, a
-- šema je govorila `buyer` / `soldAt` / `SOLD`.
--
-- 🔴 SVAKA NAREDBA JE IDEMPOTENTNA, i to nije stil nego posledica kvara od 15.09.2026.
-- Prva verzija ovog fajla je pala sa `"SOLD" is not an existing enum label`: preimenovanje
-- je u test bazi već bilo sprovedeno, a red u `_prisma_migrations` je ostao FAILED. Od tog
-- trenutka je `prisma migrate deploy` odbijao SVE naredne migracije sa P3009, pa je svaki
-- build — i na granama i na `main` — padao tri dana. Zatečeno stanje baze se posle takvog
-- pada ne zna unapred, pa migracija mora da prođe i kad je posao već obavljen i kad nije.
--
-- `ALTER TYPE ... RENAME VALUE` je transakciono bezbedno (za razliku od ADD VALUE),
-- pa enum i kolone smeju u isti fajl.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ListingStatus' AND e.enumlabel = 'SOLD'
  ) THEN
    ALTER TYPE "ListingStatus" RENAME VALUE 'SOLD' TO 'RAZMENJEN';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MarketplaceListing' AND column_name = 'buyerId'
  ) THEN
    ALTER TABLE "MarketplaceListing" RENAME COLUMN "buyerId" TO "primalacId";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MarketplaceListing' AND column_name = 'soldAt'
  ) THEN
    ALTER TABLE "MarketplaceListing" RENAME COLUMN "soldAt" TO "razmenjenoAt";
  END IF;
END $$;

-- Ime FK ograničenja prati ime kolone u Prisma konvenciji; bez ovoga bi `migrate dev`
-- prijavljivao drift. DO blok jer Postgres nema `RENAME CONSTRAINT IF EXISTS`.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'MarketplaceListing_buyerId_fkey'
      AND conrelid = '"MarketplaceListing"'::regclass
  ) THEN
    ALTER TABLE "MarketplaceListing"
      RENAME CONSTRAINT "MarketplaceListing_buyerId_fkey" TO "MarketplaceListing_primalacId_fkey";
  END IF;
END $$;
