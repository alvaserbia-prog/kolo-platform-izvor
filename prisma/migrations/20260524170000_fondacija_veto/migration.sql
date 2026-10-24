-- Fondacija — transparentnost i Zastitni veto (cl. 71)

CREATE TYPE "FondacijaTrosakKategorija" AS ENUM ('PLATA', 'INFRASTRUKTURA', 'PRAVNI_TROSAK', 'SOFTWARE', 'ADMINISTRATIVNO', 'OPERATIVNO', 'DRUGO');

CREATE TABLE "FondacijaTrosak" (
    "id" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "iznosRSD" DECIMAL(12,2) NOT NULL,
    "kategorija" "FondacijaTrosakKategorija" NOT NULL,
    "opis" TEXT NOT NULL,
    "dokumentUrl" TEXT,
    "kreiraoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FondacijaTrosak_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FondacijaTrosak_datum_idx" ON "FondacijaTrosak"("datum");
CREATE INDEX "FondacijaTrosak_kategorija_datum_idx" ON "FondacijaTrosak"("kategorija", "datum");
ALTER TABLE "FondacijaTrosak" ADD CONSTRAINT "FondacijaTrosak_kreiraoId_fkey" FOREIGN KEY ("kreiraoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SistemskiVeto" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "aktivan" BOOLEAN NOT NULL DEFAULT false,
    "trajnoUgasen" BOOLEAN NOT NULL DEFAULT false,
    "datumAktivacije" TIMESTAMP(3),
    "datumGasenja" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SistemskiVeto_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SistemskiVeto" (id, "updatedAt") VALUES ('singleton', NOW());
