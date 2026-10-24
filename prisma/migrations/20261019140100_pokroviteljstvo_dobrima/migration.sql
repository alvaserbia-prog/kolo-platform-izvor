-- Pokroviteljstvo dobrima i uslugama: prijava i ugovor (UgovorDobra), dokaz cene
-- (DokazCeneDobra, vidi ga samo administratorski tim), vaučeri (Vaucer) i prijave
-- na raspodelu (PrijavaRaspodele). Donacije Glava IVa, nabavke Glava VIIIa.

-- CreateEnum
CREATE TYPE "VrstaDobraPokrovitelja" AS ENUM ('DOBRO', 'USLUGA');

-- CreateEnum
CREATE TYPE "UgovorDobraStatus" AS ENUM ('NA_PREGLEDU', 'CEKA_POTPIS', 'POTPISAN', 'ODBIJEN');

-- CreateEnum
CREATE TYPE "VaucerStatus" AS ENUM ('SLOBODAN', 'DODELJEN', 'ISKORISCEN', 'ISTEKAO', 'NEIZVRSEN');

-- CreateTable
CREATE TABLE "UgovorDobra" (
    "id" TEXT NOT NULL,
    "podnosilacId" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "pib" TEXT NOT NULL,
    "maticniBroj" TEXT NOT NULL,
    "adresaSedista" TEXT NOT NULL,
    "zastupnikImePrezime" TEXT NOT NULL,
    "zastupnikFunkcija" TEXT NOT NULL,
    "vrsta" "VrstaDobraPokrovitelja" NOT NULL,
    "opis" TEXT NOT NULL,
    "brojVaucera" INTEGER NOT NULL,
    "cenaPoJedinici" DECIMAL(12,2) NOT NULL,
    "vrednostRsd" DECIMAL(12,2) NOT NULL,
    "rokVazenjaMeseci" INTEGER NOT NULL,
    "mesto" TEXT NOT NULL,
    "adresaPredaje" TEXT,
    "nedeljniKapacitet" INTEGER,
    "izjavaPropisiAt" TIMESTAMP(3) NOT NULL,
    "status" "UgovorDobraStatus" NOT NULL DEFAULT 'NA_PREGLEDU',
    "odbijenoRazlog" TEXT,
    "pregledaoId" TEXT,
    "pregledanoAt" TIMESTAMP(3),
    "aprUporedjenAt" TIMESTAMP(3),
    "cenaUporedjenaAt" TIMESTAMP(3),
    "ugovorTekst" TEXT,
    "potpisanoAt" TIMESTAMP(3),
    "vaziDo" TIMESTAMP(3),
    "koeficijent" DECIMAL(4,2),
    "poenEvidentirano" INTEGER,
    "emisijaTxId" TEXT,
    "raspodelaKrug" INTEGER NOT NULL DEFAULT 0,
    "poenaPoVauceru" INTEGER,
    "raspodelaObjavljenaAt" TIMESTAMP(3),
    "rokPrijaveRaspodele" TIMESTAMP(3),
    "raspodelaDodeljenaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UgovorDobra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DokazCeneDobra" (
    "id" TEXT NOT NULL,
    "ugovorId" TEXT NOT NULL,
    "vrsta" TEXT NOT NULL,
    "nazivFajla" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "velicina" INTEGER NOT NULL,
    "sadrzaj" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DokazCeneDobra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaucer" (
    "id" TEXT NOT NULL,
    "ugovorId" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "status" "VaucerStatus" NOT NULL DEFAULT 'SLOBODAN',
    "imalacId" TEXT,
    "dodeljenAt" TIMESTAMP(3),
    "rezervisano" INTEGER NOT NULL DEFAULT 0,
    "ponisteno" INTEGER NOT NULL DEFAULT 0,
    "iskoriscenAt" TIMESTAMP(3),
    "ponistenjeTxId" TEXT,
    "istekaoAt" TIMESTAMP(3),
    "neizvrsenAt" TIMESTAMP(3),
    "ispravkaTxId" TEXT,
    "otpisTxId" TEXT,
    "otpisano" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaucer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrijavaRaspodele" (
    "id" TEXT NOT NULL,
    "ugovorId" TEXT NOT NULL,
    "krug" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "izjavaNepovezanAt" TIMESTAMP(3) NOT NULL,
    "ishod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrijavaRaspodele_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UgovorDobra_podnosilacId_idx" ON "UgovorDobra"("podnosilacId");

-- CreateIndex
CREATE INDEX "UgovorDobra_maticniBroj_createdAt_idx" ON "UgovorDobra"("maticniBroj", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UgovorDobra_status_idx" ON "UgovorDobra"("status");

-- CreateIndex
CREATE INDEX "DokazCeneDobra_ugovorId_idx" ON "DokazCeneDobra"("ugovorId");

-- CreateIndex
CREATE UNIQUE INDEX "Vaucer_kod_key" ON "Vaucer"("kod");

-- CreateIndex
CREATE INDEX "Vaucer_ugovorId_status_idx" ON "Vaucer"("ugovorId", "status");

-- CreateIndex
CREATE INDEX "Vaucer_imalacId_status_idx" ON "Vaucer"("imalacId", "status");

-- CreateIndex
CREATE INDEX "PrijavaRaspodele_userId_idx" ON "PrijavaRaspodele"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PrijavaRaspodele_ugovorId_krug_userId_key" ON "PrijavaRaspodele"("ugovorId", "krug", "userId");

-- AddForeignKey
ALTER TABLE "UgovorDobra" ADD CONSTRAINT "UgovorDobra_podnosilacId_fkey" FOREIGN KEY ("podnosilacId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DokazCeneDobra" ADD CONSTRAINT "DokazCeneDobra_ugovorId_fkey" FOREIGN KEY ("ugovorId") REFERENCES "UgovorDobra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaucer" ADD CONSTRAINT "Vaucer_ugovorId_fkey" FOREIGN KEY ("ugovorId") REFERENCES "UgovorDobra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaucer" ADD CONSTRAINT "Vaucer_imalacId_fkey" FOREIGN KEY ("imalacId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaRaspodele" ADD CONSTRAINT "PrijavaRaspodele_ugovorId_fkey" FOREIGN KEY ("ugovorId") REFERENCES "UgovorDobra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrijavaRaspodele" ADD CONSTRAINT "PrijavaRaspodele_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
