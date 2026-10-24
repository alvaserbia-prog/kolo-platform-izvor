-- Prijava da razmena povodom prepisa POEN-a nije ispunjena, i poništenje prepisa
-- protivzapisom po odluci Fondacije.
--
-- Prepis je ažuriranje evidencije između dva zapisa (Pravilnik čl. 14, 16). Do
-- sada ga ništa nije moglo obarati: jedino poništenje POEN-a u sistemu bilo je
-- ono iz utvrđene lažne potvrde (dokaz stvarnosti čl. 20a).
--
-- `PONISTENJE_PREPISA` je ZASEBAN tip transakcije, ne TRANSFER — brojač putanje
-- doprinosa razmeni (čl. 40b) čita same transakcije tipa TRANSFER, pa bi povraćaj
-- upisan kao TRANSFER lažno otvorio korak 2 onome kome je prepis poništen.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PONISTENJE_PREPISA';

CREATE TYPE "PrijavaRazmeneStatus" AS ENUM ('OTVORENA', 'PONISTENA', 'ODBACENA');

CREATE TABLE "PrijavaRazmene" (
    "id" TEXT NOT NULL,
    "transakcijaId" TEXT NOT NULL,
    "prijaviocId" TEXT NOT NULL,
    "protivId" TEXT NOT NULL,
    "opis" TEXT NOT NULL,
    "status" "PrijavaRazmeneStatus" NOT NULL DEFAULT 'OTVORENA',
    "odluka" TEXT,
    "resioId" TEXT,
    "resenAt" TIMESTAMP(3),
    "vraceno" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrijavaRazmene_pkey" PRIMARY KEY ("id")
);

-- Jedna prijava po prepisu: druga ne bi bila nov podatak nego ponovljen pritisak.
CREATE UNIQUE INDEX "PrijavaRazmene_transakcijaId_key" ON "PrijavaRazmene"("transakcijaId");
CREATE INDEX "PrijavaRazmene_status_createdAt_idx" ON "PrijavaRazmene"("status", "createdAt" DESC);
CREATE INDEX "PrijavaRazmene_prijaviocId_idx" ON "PrijavaRazmene"("prijaviocId");

ALTER TABLE "PrijavaRazmene" ADD CONSTRAINT "PrijavaRazmene_transakcijaId_fkey" FOREIGN KEY ("transakcijaId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrijavaRazmene" ADD CONSTRAINT "PrijavaRazmene_prijaviocId_fkey" FOREIGN KEY ("prijaviocId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrijavaRazmene" ADD CONSTRAINT "PrijavaRazmene_protivId_fkey" FOREIGN KEY ("protivId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
