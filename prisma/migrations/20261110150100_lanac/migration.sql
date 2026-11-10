-- Set 5.1.2: jedan motor za program raspodele hrane (nabavke Glava X) i lanac proizvodnje i
-- distribucije (Glava XI): poziv, prijave, lanac, karike, zapisnici o primopredaji, doprinosi, vaučeri.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "VrstaLanca" AS ENUM ('PROGRAM_HRANE', 'LANAC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "StatusLanca" AS ENUM ('PRIPREMA', 'VAUCERI_IZDATI', 'ZATVOREN', 'PRESTAO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UlogaKarike" AS ENUM ('DAVALAC_SIROVINE', 'PARTNER', 'POSLEDNJI');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UlogaPrijaveLanca" AS ENUM ('GAZDINSTVO', 'OBJEKAT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "StatusPrijaveLanca" AS ENUM ('NA_PREGLEDU', 'PRIHVACENA', 'ODBIJENA', 'POVUCENA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OsnovDoprinosaLanca" AS ENUM ('SIROVINA', 'USLUGA', 'DISTRIBUCIJA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "StatusDoprinosaLanca" AS ENUM ('ZABELEZEN', 'EVIDENTIRAN', 'PONISTEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "StatusLanacVaucera" AS ENUM ('SLOBODAN', 'DODELJEN', 'ISKORISCEN', 'ISTEKAO', 'PRENET', 'PRESTAO', 'NEPREUZET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OrganOdlukeLanca" AS ENUM ('UPRAVNI_ODBOR', 'GORNJE_KOLO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanacPoziv" (
    "id" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "opis" TEXT NOT NULL,
    "uslovi" TEXT NOT NULL,
    "rokObradeDana" INTEGER NOT NULL,
    "objavioId" TEXT NOT NULL,
    "objavljenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zatvorenAt" TIMESTAMP(3),

    CONSTRAINT "LanacPoziv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanacPrijava" (
    "id" TEXT NOT NULL,
    "pozivId" TEXT NOT NULL,
    "uloga" "UlogaPrijaveLanca" NOT NULL,
    "userId" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "mesto" TEXT NOT NULL,
    "adresa" TEXT,
    "bpg" TEXT,
    "brojOdobrenja" TEXT,
    "hranaOdgovori" JSONB,
    "hranaKategorija" TEXT,
    "hranaKoeficijent" DECIMAL(4,2),
    "cenovnikCena" DECIMAL(12,2),
    "uslugaOpis" TEXT,
    "uslugaJedinica" TEXT,
    "uslugaCena" DECIMAL(12,2),
    "cenovnikUrl" TEXT,
    "zadrugaId" TEXT,
    "izjavaAt" TIMESTAMP(3) NOT NULL,
    "izjavaTekst" TEXT NOT NULL,
    "status" "StatusPrijaveLanca" NOT NULL DEFAULT 'NA_PREGLEDU',
    "odlucioId" TEXT,
    "odlukaAt" TIMESTAMP(3),
    "razlogOdbijanja" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanacPrijava_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Lanac" (
    "id" TEXT NOT NULL,
    "vrsta" "VrstaLanca" NOT NULL,
    "pozivId" TEXT,
    "naziv" TEXT NOT NULL,
    "vrstaHrane" TEXT,
    "stipsKategorija" TEXT,
    "jedinica" TEXT NOT NULL DEFAULT 'kg',
    "brojVaucera" INTEGER NOT NULL,
    "kolicinaPoVauceru" TEXT NOT NULL,
    "koeficijentSirovine" DECIMAL(4,2),
    "dodatakDistribucijePct" DECIMAL(5,2),
    "odlukaOrgan" "OrganOdlukeLanca",
    "odlukaBroj" TEXT,
    "odlukaDatum" TIMESTAMP(3),
    "odlukaTekst" TEXT,
    "odlukaUpisaoId" TEXT,
    "odlukaUpisanaAt" TIMESTAMP(3),
    "status" "StatusLanca" NOT NULL DEFAULT 'PRIPREMA',
    "objavljenAt" TIMESTAMP(3),
    "poenaPoVauceru" INTEGER,
    "vauceriIzdatiAt" TIMESTAMP(3),
    "spremnoAt" TIMESTAMP(3),
    "neispravnoAt" TIMESTAMP(3),
    "neispravnoRazlog" TEXT,
    "zatvorenAt" TIMESTAMP(3),
    "kreiraoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lanac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanacKarika" (
    "id" TEXT NOT NULL,
    "lanacId" TEXT NOT NULL,
    "redniBroj" INTEGER NOT NULL,
    "uloga" "UlogaKarike" NOT NULL,
    "prijavaId" TEXT,
    "userId" TEXT NOT NULL,
    "zadrugaId" TEXT,
    "naziv" TEXT NOT NULL,
    "mestoPredaje" TEXT NOT NULL,
    "adresaPredaje" TEXT,
    "uslugaOpis" TEXT,
    "jedinica" TEXT,
    "cenaPoJedinici" DECIMAL(12,2),
    "obim" DECIMAL(12,2),
    "koeficijent" DECIMAL(4,2) NOT NULL,
    "izdajeKorisnicima" BOOLEAN NOT NULL DEFAULT false,
    "ugovorTekst" TEXT,
    "ugovorPrihvacenAt" TIMESTAMP(3),
    "izvrsenoPrijavljenoAt" TIMESTAMP(3),
    "izvrsenjeUtvrdioId" TEXT,
    "izvrsenjeUtvrdjenoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanacKarika_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanacPredaja" (
    "id" TEXT NOT NULL,
    "lanacId" TEXT NOT NULL,
    "odKarikaId" TEXT NOT NULL,
    "doKarikaId" TEXT NOT NULL,
    "kolicina" DECIMAL(12,3) NOT NULL,
    "oznakeZivotinja" TEXT,
    "obimUsluge" DECIMAL(12,2),
    "predaoId" TEXT NOT NULL,
    "primioId" TEXT NOT NULL,
    "zabelezenoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predaoPotvrdioAt" TIMESTAMP(3),
    "cenaIzvor" TEXT,
    "cenaPoJedinici" DECIMAL(12,2),
    "vrednostRsd" DECIMAL(12,2),
    "stipsKategorija" TEXT,
    "stipsBiltenId" TEXT,
    "stipsSnimak" JSONB,
    "potvrdaFondacijeAt" TIMESTAMP(3),
    "potvrdioId" TEXT,

    CONSTRAINT "LanacPredaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanacDoprinos" (
    "id" TEXT NOT NULL,
    "lanacId" TEXT NOT NULL,
    "karikaId" TEXT NOT NULL,
    "osnov" "OsnovDoprinosaLanca" NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT,
    "zadrugaId" TEXT,
    "vrednostRsd" DECIMAL(12,2) NOT NULL,
    "koeficijent" DECIMAL(4,2) NOT NULL,
    "iznos" INTEGER NOT NULL,
    "status" "StatusDoprinosaLanca" NOT NULL DEFAULT 'ZABELEZEN',
    "zabelezenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidentiranAt" TIMESTAMP(3),
    "emisijaTxId" TEXT,

    CONSTRAINT "LanacDoprinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanacVaucer" (
    "id" TEXT NOT NULL,
    "lanacId" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "status" "StatusLanacVaucera" NOT NULL DEFAULT 'SLOBODAN',
    "imalacId" TEXT,
    "dodeljenAt" TIMESTAMP(3),
    "ponisteno" INTEGER NOT NULL DEFAULT 0,
    "ponistenjeTxId" TEXT,
    "izjavaNepovezanAt" TIMESTAMP(3),
    "pristanakPrikazAt" TIMESTAMP(3),
    "pristanakPrikazTekst" TEXT,
    "pristanakPovucenAt" TIMESTAMP(3),
    "iskoriscenAt" TIMESTAMP(3),
    "potvrdioId" TEXT,
    "izdavanjeUtvrdjenoAt" TIMESTAMP(3),
    "istekaoAt" TIMESTAMP(3),
    "prestaoAt" TIMESTAMP(3),
    "ispravkaTxId" TEXT,
    "prenetIzId" TEXT,
    "nepreuzetIshod" TEXT,
    "nepreuzetAt" TIMESTAMP(3),
    "otpisano" INTEGER,
    "otpisTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanacVaucer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacPrijava_pozivId_uloga_status_idx" ON "LanacPrijava"("pozivId", "uloga", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacPrijava_userId_idx" ON "LanacPrijava"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lanac_vrsta_status_idx" ON "Lanac"("vrsta", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacKarika_userId_idx" ON "LanacKarika"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LanacKarika_lanacId_redniBroj_key" ON "LanacKarika"("lanacId", "redniBroj");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacPredaja_lanacId_idx" ON "LanacPredaja"("lanacId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacDoprinos_status_zabelezenAt_idx" ON "LanacDoprinos"("status", "zabelezenAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacDoprinos_lanacId_idx" ON "LanacDoprinos"("lanacId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacDoprinos_karikaId_idx" ON "LanacDoprinos"("karikaId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LanacVaucer_kod_key" ON "LanacVaucer"("kod");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacVaucer_lanacId_status_idx" ON "LanacVaucer"("lanacId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanacVaucer_imalacId_status_idx" ON "LanacVaucer"("imalacId", "status");

-- AddForeignKey
ALTER TABLE "LanacPrijava" ADD CONSTRAINT "LanacPrijava_pozivId_fkey" FOREIGN KEY ("pozivId") REFERENCES "LanacPoziv"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lanac" ADD CONSTRAINT "Lanac_pozivId_fkey" FOREIGN KEY ("pozivId") REFERENCES "LanacPoziv"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanacKarika" ADD CONSTRAINT "LanacKarika_lanacId_fkey" FOREIGN KEY ("lanacId") REFERENCES "Lanac"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanacPredaja" ADD CONSTRAINT "LanacPredaja_lanacId_fkey" FOREIGN KEY ("lanacId") REFERENCES "Lanac"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanacDoprinos" ADD CONSTRAINT "LanacDoprinos_lanacId_fkey" FOREIGN KEY ("lanacId") REFERENCES "Lanac"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanacVaucer" ADD CONSTRAINT "LanacVaucer_lanacId_fkey" FOREIGN KEY ("lanacId") REFERENCES "Lanac"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
