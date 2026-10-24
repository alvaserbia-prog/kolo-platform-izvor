-- Preimenovanje terminologije po Pravilniku v3.7.0:
--   KUPOVINA_ZRNO -> UPIS_ZRNO
--   PRODAJA_ZRNO  -> OTPIS_ZRNO
--   ZrnoKupovinaZahtev -> ZrnoUpisZahtev
--   ZrnoProdajaZahtev  -> ZrnoOtpisZahtev

-- 1. Enum vrednosti
ALTER TYPE "TransactionType" RENAME VALUE 'KUPOVINA_ZRNO' TO 'UPIS_ZRNO';
ALTER TYPE "TransactionType" RENAME VALUE 'PRODAJA_ZRNO' TO 'OTPIS_ZRNO';

-- 2. Tabele
ALTER TABLE "ZrnoKupovinaZahtev" RENAME TO "ZrnoUpisZahtev";
ALTER TABLE "ZrnoProdajaZahtev" RENAME TO "ZrnoOtpisZahtev";

-- 3. Indeksi i constraints automatski prate ime tabele u PostgreSQL-u,
--    ali primary key i unique constraint nazivi se ne preimenuju automatski.
--    Renamujemo ih zarad doslednosti sa Prisma generisanim imenima:
ALTER INDEX IF EXISTS "ZrnoKupovinaZahtev_pkey" RENAME TO "ZrnoUpisZahtev_pkey";
ALTER INDEX IF EXISTS "ZrnoKupovinaZahtev_userId_date_key" RENAME TO "ZrnoUpisZahtev_userId_date_key";
ALTER INDEX IF EXISTS "ZrnoKupovinaZahtev_date_status_idx" RENAME TO "ZrnoUpisZahtev_date_status_idx";

ALTER INDEX IF EXISTS "ZrnoProdajaZahtev_pkey" RENAME TO "ZrnoOtpisZahtev_pkey";
ALTER INDEX IF EXISTS "ZrnoProdajaZahtev_userId_date_key" RENAME TO "ZrnoOtpisZahtev_userId_date_key";
ALTER INDEX IF EXISTS "ZrnoProdajaZahtev_date_status_idx" RENAME TO "ZrnoOtpisZahtev_date_status_idx";

-- 4. Foreign key constraint imena
ALTER TABLE "ZrnoUpisZahtev" RENAME CONSTRAINT "ZrnoKupovinaZahtev_userId_fkey" TO "ZrnoUpisZahtev_userId_fkey";
ALTER TABLE "ZrnoOtpisZahtev" RENAME CONSTRAINT "ZrnoProdajaZahtev_userId_fkey" TO "ZrnoOtpisZahtev_userId_fkey";
