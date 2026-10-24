-- Ukloni referral / preporuke koncept (više ne postoji)

-- 1. Referral tabela
DROP TABLE "Referral";

-- 2. User kolone (referralCode + referredById)
ALTER TABLE "User" DROP CONSTRAINT "User_referredById_fkey";
DROP INDEX "User_referralCode_key";
ALTER TABLE "User" DROP COLUMN "referralCode";
ALTER TABLE "User" DROP COLUMN "referredById";

-- 3. UserPodaci — vidljivost ranga preporuka
ALTER TABLE "UserPodaci" DROP COLUMN "prikaziRangPreporuka";

-- 4. TransactionType enum — ukloni EMISIJA_PREPORUKA
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
CREATE TYPE "TransactionType" AS ENUM ('TRANSFER', 'EMISIJA_VERIFIKACIJA', 'EMISIJA_NADZOR', 'EMISIJA_DONACIJA', 'EMISIJA_POKROVITELJ', 'EMISIJA_KRUG_OSNIVANJE', 'EMISIJA_KRUG_BONUS', 'EMISIJA_PROGRAM', 'UPIS_ZRNO', 'OTPIS_ZRNO', 'EMISIJA_OSNIVACKI');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType" USING ("type"::text::"TransactionType");
DROP TYPE "TransactionType_old";
