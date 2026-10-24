-- Registar 2026-10, oblast N (set 4.8.4).
-- N4-M2: prvi ulazak na spisak za poziv — mesto i broj se posle toga ne brišu.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telefonZaPozivAt" TIMESTAMP(3);

-- N2-M6: odluka Fondacije o narednom ugovoru o dobrima (donacije čl. 13f st. 4).
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "naredniDozvoljenAt" TIMESTAMP(3);
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "naredniDozvolioId" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "naredniDozvolaRazlog" TEXT;

-- N4-M3: utvrđenje višestrukog naloga (dokaz stvarnosti čl. 4b).
CREATE TABLE IF NOT EXISTS "UtvrdjenjeVisestrukogNaloga" (
    "id" TEXT NOT NULL,
    "zadrzaniId" TEXT NOT NULL,
    "ugaseniId" TEXT NOT NULL,
    "ugaseniPseudonim" TEXT NOT NULL,
    "obrazlozenje" TEXT NOT NULL,
    "utvrdioId" TEXT NOT NULL,
    "utvrdjenoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otpisano" INTEGER NOT NULL DEFAULT 0,
    "otpisTxId" TEXT,
    "iskljucen" BOOLEAN NOT NULL DEFAULT false,
    "predmetOtvoren" BOOLEAN NOT NULL DEFAULT true,
    "predmetBeleska" TEXT,
    "predmetZatvorioId" TEXT,
    "predmetZatvorenAt" TIMESTAMP(3),
    CONSTRAINT "UtvrdjenjeVisestrukogNaloga_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UtvrdjenjeVisestrukogNaloga_ugaseniId_key" ON "UtvrdjenjeVisestrukogNaloga"("ugaseniId");
CREATE INDEX IF NOT EXISTS "UtvrdjenjeVisestrukogNaloga_zadrzaniId_idx" ON "UtvrdjenjeVisestrukogNaloga"("zadrzaniId");
CREATE INDEX IF NOT EXISTS "UtvrdjenjeVisestrukogNaloga_predmetOtvoren_idx" ON "UtvrdjenjeVisestrukogNaloga"("predmetOtvoren");
