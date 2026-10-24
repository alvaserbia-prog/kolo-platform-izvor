-- CreateEnum
CREATE TYPE "PokroviteljDoprinosTip" AS ENUM ('SPONZORSTVO_ZADRUGE', 'DONACIJA_FONDACIJI');

-- CreateTable
CREATE TABLE "Pokrovitelj" (
    "id" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "pib" TEXT NOT NULL,
    "adresa" TEXT,
    "kontaktEmail" TEXT,
    "kontaktTelefon" TEXT,
    "vlasnikId" TEXT NOT NULL,
    "kreiraoId" TEXT NOT NULL,
    "zadrugaId" TEXT,
    "rsdKumulativ" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "trenutniNivo" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pokrovitelj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokroviteljDoprinos" (
    "id" TEXT NOT NULL,
    "pokroviteljId" TEXT NOT NULL,
    "rsdIznos" DECIMAL(12,2) NOT NULL,
    "tip" "PokroviteljDoprinosTip" NOT NULL,
    "evidentiraoId" TEXT NOT NULL,
    "napomena" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PokroviteljDoprinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokroviteljBonusEmisija" (
    "id" TEXT NOT NULL,
    "pokroviteljId" TEXT NOT NULL,
    "vlasnikId" TEXT NOT NULL,
    "nivo" INTEGER NOT NULL,
    "bonusPoen" INTEGER NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PokroviteljBonusEmisija_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pokrovitelj_pib_key" ON "Pokrovitelj"("pib");

-- CreateIndex
CREATE INDEX "Pokrovitelj_vlasnikId_idx" ON "Pokrovitelj"("vlasnikId");

-- CreateIndex
CREATE INDEX "Pokrovitelj_status_idx" ON "Pokrovitelj"("status");

-- CreateIndex
CREATE INDEX "PokroviteljDoprinos_pokroviteljId_createdAt_idx" ON "PokroviteljDoprinos"("pokroviteljId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PokroviteljBonusEmisija_pokroviteljId_idx" ON "PokroviteljBonusEmisija"("pokroviteljId");

-- CreateIndex
CREATE INDEX "PokroviteljBonusEmisija_vlasnikId_idx" ON "PokroviteljBonusEmisija"("vlasnikId");

-- AddForeignKey
ALTER TABLE "Pokrovitelj" ADD CONSTRAINT "Pokrovitelj_vlasnikId_fkey" FOREIGN KEY ("vlasnikId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pokrovitelj" ADD CONSTRAINT "Pokrovitelj_kreiraoId_fkey" FOREIGN KEY ("kreiraoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pokrovitelj" ADD CONSTRAINT "Pokrovitelj_zadrugaId_fkey" FOREIGN KEY ("zadrugaId") REFERENCES "Zadruga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokroviteljDoprinos" ADD CONSTRAINT "PokroviteljDoprinos_pokroviteljId_fkey" FOREIGN KEY ("pokroviteljId") REFERENCES "Pokrovitelj"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokroviteljDoprinos" ADD CONSTRAINT "PokroviteljDoprinos_evidentiraoId_fkey" FOREIGN KEY ("evidentiraoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokroviteljBonusEmisija" ADD CONSTRAINT "PokroviteljBonusEmisija_pokroviteljId_fkey" FOREIGN KEY ("pokroviteljId") REFERENCES "Pokrovitelj"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokroviteljBonusEmisija" ADD CONSTRAINT "PokroviteljBonusEmisija_vlasnikId_fkey" FOREIGN KEY ("vlasnikId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
