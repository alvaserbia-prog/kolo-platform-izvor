-- CreateEnum
CREATE TYPE "TipKorisnika" AS ENUM ('POCETNI', 'REGULARNI', 'NOSILAC_ZRNA', 'NEVERIFIKOVAN');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'EMISIJA_NADZOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "indeksStvarnosti" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pocetnaEmisijaIzvrsena" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slotoviPotroseni" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tipKorisnika" "TipKorisnika" NOT NULL DEFAULT 'NEVERIFIKOVAN';

-- CreateTable
CREATE TABLE "VerifikacionaVeza" (
    "id" TEXT NOT NULL,
    "verifikatorId" TEXT NOT NULL,
    "redniBroj" INTEGER NOT NULL,
    "verifikovaniId" TEXT NOT NULL,
    "vremenskiZig" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nadzornikId" TEXT,
    "podlezeNadzoru" BOOLEAN NOT NULL,
    "nadzoranAt" TIMESTAMP(3),

    CONSTRAINT "VerifikacionaVeza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifikacijaToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "brojCifara" TEXT NOT NULL,
    "korisnikId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "VerifikacijaToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerifikacionaVeza_verifikovaniId_key" ON "VerifikacionaVeza"("verifikovaniId");

-- CreateIndex
CREATE INDEX "VerifikacionaVeza_verifikatorId_idx" ON "VerifikacionaVeza"("verifikatorId");

-- CreateIndex
CREATE INDEX "VerifikacionaVeza_verifikovaniId_idx" ON "VerifikacionaVeza"("verifikovaniId");

-- CreateIndex
CREATE INDEX "VerifikacionaVeza_nadzornikId_idx" ON "VerifikacionaVeza"("nadzornikId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifikacionaVeza_verifikatorId_redniBroj_key" ON "VerifikacionaVeza"("verifikatorId", "redniBroj");

-- CreateIndex
CREATE UNIQUE INDEX "VerifikacijaToken_token_key" ON "VerifikacijaToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerifikacijaToken_brojCifara_key" ON "VerifikacijaToken"("brojCifara");

-- CreateIndex
CREATE INDEX "VerifikacijaToken_korisnikId_idx" ON "VerifikacijaToken"("korisnikId");

-- CreateIndex
CREATE INDEX "VerifikacijaToken_expiresAt_idx" ON "VerifikacijaToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "VerifikacionaVeza" ADD CONSTRAINT "VerifikacionaVeza_verifikatorId_fkey" FOREIGN KEY ("verifikatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifikacionaVeza" ADD CONSTRAINT "VerifikacionaVeza_verifikovaniId_fkey" FOREIGN KEY ("verifikovaniId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifikacionaVeza" ADD CONSTRAINT "VerifikacionaVeza_nadzornikId_fkey" FOREIGN KEY ("nadzornikId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifikacijaToken" ADD CONSTRAINT "VerifikacijaToken_korisnikId_fkey" FOREIGN KEY ("korisnikId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
