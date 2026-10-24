-- Pokroviteljstvo v3.7.0: prijava pokroviteljstva + vrsta donacije (novac/roba/usluge)

-- 1) Nova enum vrednost vrste donacije; zamena starog PokroviteljDoprinosTip
CREATE TYPE "VrstaDonacije" AS ENUM ('NOVAC', 'ROBA', 'USLUGE');

ALTER TABLE "PokroviteljDoprinos"
  ALTER COLUMN "tip" TYPE "VrstaDonacije"
  USING (
    CASE "tip"::text
      WHEN 'DONACIJA_FONDACIJI' THEN 'NOVAC'
      WHEN 'SPONZORSTVO_KRUGA' THEN 'NOVAC'
      ELSE 'NOVAC'
    END
  )::"VrstaDonacije";

DROP TYPE "PokroviteljDoprinosTip";

-- 2) Status prijave pokroviteljstva
CREATE TYPE "PokroviteljPrijavaStatus" AS ENUM ('CEKA_POTPIS', 'POTPISANA', 'POTVRDJENA', 'ODBIJENA');

-- 3) Tabela prijava
CREATE TABLE "PokroviteljPrijava" (
    "id" TEXT NOT NULL,
    "podnosilacId" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "pib" TEXT NOT NULL,
    "vrstaDonacije" "VrstaDonacije" NOT NULL,
    "vrednostRsd" DECIMAL(12,2) NOT NULL,
    "cenovnikSlika" TEXT,
    "ugovorTekst" TEXT NOT NULL,
    "status" "PokroviteljPrijavaStatus" NOT NULL DEFAULT 'CEKA_POTPIS',
    "potpisanoAt" TIMESTAMP(3),
    "pokroviteljId" TEXT,
    "potvrdioId" TEXT,
    "potvrdjenoAt" TIMESTAMP(3),
    "odbijenoRazlog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PokroviteljPrijava_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PokroviteljPrijava_podnosilacId_idx" ON "PokroviteljPrijava"("podnosilacId");
CREATE INDEX "PokroviteljPrijava_status_idx" ON "PokroviteljPrijava"("status");

ALTER TABLE "PokroviteljPrijava" ADD CONSTRAINT "PokroviteljPrijava_podnosilacId_fkey" FOREIGN KEY ("podnosilacId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PokroviteljPrijava" ADD CONSTRAINT "PokroviteljPrijava_pokroviteljId_fkey" FOREIGN KEY ("pokroviteljId") REFERENCES "Pokrovitelj"("id") ON DELETE SET NULL ON UPDATE CASCADE;
