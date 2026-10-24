-- Nosilac registrovanog poljoprivrednog gazdinstva kao davalac (donacije čl. 13e st. 3,
-- čl. 13f st. 2, set 4.7.8). Nov enum TIP (ne nova vrednost postojećeg) sme u isti fajl.

-- CreateEnum
CREATE TYPE "VrstaDavaoca" AS ENUM ('FIRMA', 'GAZDINSTVO');

-- AlterTable
ALTER TABLE "UgovorDobra" ADD COLUMN "vrstaDavaoca" "VrstaDavaoca" NOT NULL DEFAULT 'FIRMA';
ALTER TABLE "UgovorDobra" ADD COLUMN "bpg" TEXT;
ALTER TABLE "UgovorDobra" ALTER COLUMN "pib" DROP NOT NULL;
ALTER TABLE "UgovorDobra" ALTER COLUMN "maticniBroj" DROP NOT NULL;
ALTER TABLE "UgovorDobra" ALTER COLUMN "adresaSedista" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DokazCeneDobra" ADD COLUMN "izvorRedni" INTEGER;

-- CreateTable
CREATE TABLE "IzvorCeneDobra" (
    "id" TEXT NOT NULL,
    "ugovorId" TEXT NOT NULL,
    "redniBroj" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "datumIzvora" TIMESTAMP(3) NOT NULL,
    "cena" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IzvorCeneDobra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IzvorCeneDobra_ugovorId_redniBroj_key" ON "IzvorCeneDobra"("ugovorId", "redniBroj");

-- CreateIndex
CREATE INDEX "UgovorDobra_bpg_createdAt_idx" ON "UgovorDobra"("bpg", "createdAt" DESC);

-- Firma nosi PIB i matični broj, gazdinstvo broj gazdinstva.
ALTER TABLE "UgovorDobra" ADD CONSTRAINT "UgovorDobra_davalac_identifikator" CHECK (
  ("vrstaDavaoca" = 'FIRMA' AND "pib" IS NOT NULL AND "maticniBroj" IS NOT NULL)
  OR ("vrstaDavaoca" = 'GAZDINSTVO' AND "bpg" IS NOT NULL)
);

-- AddForeignKey
ALTER TABLE "IzvorCeneDobra" ADD CONSTRAINT "IzvorCeneDobra_ugovorId_fkey" FOREIGN KEY ("ugovorId") REFERENCES "UgovorDobra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
