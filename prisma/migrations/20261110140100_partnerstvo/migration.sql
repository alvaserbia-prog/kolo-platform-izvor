-- Set 5.1.2: partnerstvo (Pravilnik o pokroviteljstvu i donacijama čl. 40–45): prijava iz upisa
-- pokrovitelja, ugovor sa snimljenim tekstom, izvršenja koja se beleže pa evidentiraju u narednom
-- obračunskom periodu (sopstveni tip emisije, prethodna migracija).

-- CreateEnum
CREATE TYPE "PartnerstvoStatus" AS ENUM ('NA_PREGLEDU', 'PRIHVACENO', 'ODBIJENO', 'PRESTALO');

-- CreateEnum
CREATE TYPE "IzvrsenjePartnerstvaStatus" AS ENUM ('PRIJAVLJENO', 'ZABELEZENO', 'EVIDENTIRANO', 'ODBIJENO', 'PONISTENO');

-- CreateTable
CREATE TABLE "Partnerstvo" (
    "id" TEXT NOT NULL,
    "upisId" TEXT NOT NULL,
    "podnosilacId" TEXT NOT NULL,
    "vrstaDavaoca" "VrstaDavaoca" NOT NULL,
    "naziv" TEXT NOT NULL,
    "pib" TEXT,
    "maticniBroj" TEXT,
    "adresaSedista" TEXT,
    "bpg" TEXT,
    "zastupnikImePrezime" TEXT NOT NULL,
    "zastupnikFunkcija" TEXT NOT NULL,
    "odnosPremaDavaocu" "OdnosPremaDavaocu" NOT NULL,
    "kontaktEmail" TEXT NOT NULL,
    "kontaktTelefon" TEXT NOT NULL,
    "logoUrl" TEXT,
    "izjavaOvlascenjeAt" TIMESTAMP(3),
    "potvrdaEvidentiranjaAt" TIMESTAMP(3),
    "potvrdaEvidentiranjaTekst" TEXT,
    "opis" TEXT NOT NULL,
    "jedinicaMere" TEXT NOT NULL,
    "cenaPoJedinici" DECIMAL(12,2) NOT NULL,
    "obim" DECIMAL(12,2) NOT NULL,
    "vrednostRsd" DECIMAL(14,2) NOT NULL,
    "rokIzvrsenja" TIMESTAMP(3) NOT NULL,
    "obradaPodataka" BOOLEAN NOT NULL DEFAULT false,
    "dpaZabelezenAt" TIMESTAMP(3),
    "dpaZabelezioId" TEXT,
    "izjavaPodnosiocaAt" TIMESTAMP(3) NOT NULL,
    "status" "PartnerstvoStatus" NOT NULL DEFAULT 'NA_PREGLEDU',
    "odlucioId" TEXT,
    "odlucenoAt" TIMESTAMP(3),
    "odbijenoRazlog" TEXT,
    "dobavljacIzjavaAt" TIMESTAMP(3),
    "ugovorTekst" TEXT,
    "kontrolniBroj" TEXT,
    "zakljucenoAt" TIMESTAMP(3),
    "ovlascenoLiceId" TEXT,
    "prestaloAt" TIMESTAMP(3),
    "prestanakRazlog" TEXT,
    "prestanakId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partnerstvo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DokazPartnerstva" (
    "id" TEXT NOT NULL,
    "partnerstvoId" TEXT NOT NULL,
    "nazivFajla" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "velicina" INTEGER NOT NULL,
    "sadrzaj" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DokazPartnerstva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IzvrsenjePartnerstva" (
    "id" TEXT NOT NULL,
    "partnerstvoId" TEXT NOT NULL,
    "prijavioId" TEXT NOT NULL,
    "obim" DECIMAL(12,2) NOT NULL,
    "opis" TEXT NOT NULL,
    "status" "IzvrsenjePartnerstvaStatus" NOT NULL DEFAULT 'PRIJAVLJENO',
    "potvrdioId" TEXT,
    "potvrdjenoAt" TIMESTAMP(3),
    "odbijenoRazlog" TEXT,
    "poen" INTEGER,
    "emisijaTxId" TEXT,
    "evidentiranoAt" TIMESTAMP(3),
    "ponistenoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IzvrsenjePartnerstva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Partnerstvo_podnosilacId_idx" ON "Partnerstvo"("podnosilacId");

-- CreateIndex
CREATE INDEX "Partnerstvo_upisId_status_idx" ON "Partnerstvo"("upisId", "status");

-- CreateIndex
CREATE INDEX "Partnerstvo_status_idx" ON "Partnerstvo"("status");

-- CreateIndex
CREATE INDEX "Partnerstvo_maticniBroj_idx" ON "Partnerstvo"("maticniBroj");

-- CreateIndex
CREATE INDEX "Partnerstvo_ovlascenoLiceId_idx" ON "Partnerstvo"("ovlascenoLiceId");

-- CreateIndex
CREATE INDEX "DokazPartnerstva_partnerstvoId_idx" ON "DokazPartnerstva"("partnerstvoId");

-- CreateIndex
CREATE INDEX "IzvrsenjePartnerstva_partnerstvoId_status_idx" ON "IzvrsenjePartnerstva"("partnerstvoId", "status");

-- CreateIndex
CREATE INDEX "IzvrsenjePartnerstva_status_potvrdjenoAt_idx" ON "IzvrsenjePartnerstva"("status", "potvrdjenoAt");

-- AddForeignKey
ALTER TABLE "Partnerstvo" ADD CONSTRAINT "Partnerstvo_upisId_fkey" FOREIGN KEY ("upisId") REFERENCES "UpisPokrovitelja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnerstvo" ADD CONSTRAINT "Partnerstvo_podnosilacId_fkey" FOREIGN KEY ("podnosilacId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DokazPartnerstva" ADD CONSTRAINT "DokazPartnerstva_partnerstvoId_fkey" FOREIGN KEY ("partnerstvoId") REFERENCES "Partnerstvo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzvrsenjePartnerstva" ADD CONSTRAINT "IzvrsenjePartnerstva_partnerstvoId_fkey" FOREIGN KEY ("partnerstvoId") REFERENCES "Partnerstvo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

