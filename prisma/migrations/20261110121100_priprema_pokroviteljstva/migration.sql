-- Set 5.1.2: upis i prijava pokroviteljstva koje priprema Fondacija (donacije čl. 16 st. 6,
-- čl. 17 st. 4, čl. 18 st. 2).
CREATE TABLE "PripremaPokroviteljstva" (
    "id" TEXT NOT NULL,
    "korisnikId" TEXT NOT NULL,
    "pripremioId" TEXT NOT NULL,
    "upisPodaci" JSONB NOT NULL,
    "mapaMesto" TEXT NOT NULL,
    "logoUrl" TEXT,
    "aprUporedjenAt" TIMESTAMP(3),
    "vrstaPrijave" TEXT,
    "vrednostRsd" DECIMAL(12,2),
    "predmetDobra" JSONB,
    "mestoPredaje" TEXT,
    "prihvacenoAt" TIMESTAMP(3),
    "upisId" TEXT,
    "prijavaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PripremaPokroviteljstva_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PripremaCenovnik" (
    "id" TEXT NOT NULL,
    "pripremaId" TEXT NOT NULL,
    "nazivFajla" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "velicina" INTEGER NOT NULL,
    "sadrzaj" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PripremaCenovnik_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PripremaPokroviteljstva_korisnikId_idx" ON "PripremaPokroviteljstva"("korisnikId");
CREATE INDEX "PripremaCenovnik_pripremaId_idx" ON "PripremaCenovnik"("pripremaId");

ALTER TABLE "PripremaPokroviteljstva" ADD CONSTRAINT "PripremaPokroviteljstva_korisnikId_fkey" FOREIGN KEY ("korisnikId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PripremaCenovnik" ADD CONSTRAINT "PripremaCenovnik_pripremaId_fkey" FOREIGN KEY ("pripremaId") REFERENCES "PripremaPokroviteljstva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
