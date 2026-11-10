-- Set 5.1.2: negativan zapis pri prestanku statusa (Pravilnik čl. 33 st. 7, Registar br. 29).
CREATE TABLE IF NOT EXISTS "NegativanZapisPrestanak" (
    "id" TEXT NOT NULL,
    "prestaliId" TEXT NOT NULL,
    "pseudonim" TEXT NOT NULL,
    "iznos" INTEGER NOT NULL,
    "osnov" TEXT NOT NULL,
    "prestanakAt" TIMESTAMP(3) NOT NULL,
    "istice" TIMESTAMP(3) NOT NULL,
    "imePrezime" TEXT,
    "mesto" TEXT,
    "telefon" TEXT,
    CONSTRAINT "NegativanZapisPrestanak_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NegativanZapisPrestanak_prestaliId_key" ON "NegativanZapisPrestanak"("prestaliId");
CREATE INDEX IF NOT EXISTS "NegativanZapisPrestanak_istice_idx" ON "NegativanZapisPrestanak"("istice");

CREATE TABLE IF NOT EXISTS "PrenosNegativnogZapisa" (
    "id" TEXT NOT NULL,
    "prestaliId" TEXT NOT NULL,
    "prestaliPseudonim" TEXT NOT NULL,
    "noviId" TEXT NOT NULL,
    "iznos" INTEGER NOT NULL,
    "obrazlozenje" TEXT NOT NULL,
    "utvrdioId" TEXT NOT NULL,
    "utvrdjenoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transakcijaId" TEXT NOT NULL,
    CONSTRAINT "PrenosNegativnogZapisa_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PrenosNegativnogZapisa_noviId_idx" ON "PrenosNegativnogZapisa"("noviId");
