-- Kolektivna nabavka: rečnik naziva, registar predloga, nabavka sa kalkulacijom,
-- prijave i projektni odliv (Pravilnik o projektima i kolektivnim nabavkama 4.4.1).

CREATE TYPE "NabavkaStatus" AS ENUM (
  'NACRT',
  'OBJAVLJENA',
  'RED_UTVRDJEN',
  'PLACENA',
  'ZAVRSENA',
  'OBUSTAVLJENA'
);

CREATE TYPE "NabavkaPrijavaStatus" AS ENUM (
  'PRIJAVLJEN',
  'POZVAN',
  'POTVRDIO',
  'PREUZEO',
  'ODUSTAO',
  'ISTEKAO',
  'NIJE_PREUZEO'
);

-- Rečnik naziva. Bez njega bi „gorivo", „dizel" i „gorivo za traktor" bili tri
-- stavke za istu stvar, pa nijedan naziv nikad ne bi skupio dovoljno korisnika.
CREATE TABLE "NazivDobra" (
  "id"         TEXT NOT NULL,
  "naziv"      TEXT NOT NULL,
  "nazivLower" TEXT NOT NULL,
  "kreiraoId"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NazivDobra_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NazivDobra_nazivLower_key" ON "NazivDobra"("nazivLower");
CREATE INDEX "NazivDobra_createdAt_idx" ON "NazivDobra"("createdAt");
ALTER TABLE "NazivDobra" ADD CONSTRAINT "NazivDobra_kreiraoId_fkey"
  FOREIGN KEY ("kreiraoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Jedan aktivan predlog po korisniku (čl. 9 st. 3) — jednokratnost drži BAZA.
CREATE TABLE "PredlogNabavke" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "nazivId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PredlogNabavke_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PredlogNabavke_userId_key" ON "PredlogNabavke"("userId");
CREATE INDEX "PredlogNabavke_nazivId_idx" ON "PredlogNabavke"("nazivId");
ALTER TABLE "PredlogNabavke" ADD CONSTRAINT "PredlogNabavke_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PredlogNabavke" ADD CONSTRAINT "PredlogNabavke_nazivId_fkey"
  FOREIGN KEY ("nazivId") REFERENCES "NazivDobra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Kalkulacija se SNIMA na zapis: po čl. 20 st. 2 se posle objave ne menja, a bez
-- snimka bi se prikazani brojevi menjali sa saldom Fondacije i tržišnom cenom.
CREATE TABLE "Nabavka" (
  "id"                TEXT NOT NULL,
  "nazivId"           TEXT NOT NULL,
  "status"            "NabavkaStatus" NOT NULL DEFAULT 'NACRT',
  "glasanjePredlogId" TEXT,
  "saldoSnimak"       DECIMAL(12,2),
  "rezervaSnimak"     DECIMAL(12,2),
  "iznosNabavke"      DECIMAL(12,2),
  "dobavljac"         TEXT,
  "jedinicaMere"      TEXT,
  "nabavnaCena"       DECIMAL(12,2),
  "maloprodajna"      INTEGER,
  "izvoriCena"        TEXT,
  "brojJedinica"      INTEGER,
  "brojDelova"        INTEGER,
  "velicinaDela"      INTEGER,
  "poenPoDelu"        INTEGER,
  "prijaveDo"         TIMESTAMP(3),
  "mestoPreuzimanja"  TEXT,
  "preuzimanjeOd"     TIMESTAMP(3),
  "preuzimanjeDo"     TIMESTAMP(3),
  "objavljenoAt"      TIMESTAMP(3),
  "redUtvrdjenAt"     TIMESTAMP(3),
  "placenoAt"         TIMESTAMP(3),
  "placenoRSD"        DECIMAL(12,2),
  "zavrsenoAt"        TIMESTAMP(3),
  "obustavljenoAt"    TIMESTAMP(3),
  "obustavaRazlog"    TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Nabavka_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Nabavka_glasanjePredlogId_key" ON "Nabavka"("glasanjePredlogId");
CREATE INDEX "Nabavka_status_createdAt_idx" ON "Nabavka"("status", "createdAt");
CREATE INDEX "Nabavka_nazivId_idx" ON "Nabavka"("nazivId");
ALTER TABLE "Nabavka" ADD CONSTRAINT "Nabavka_nazivId_fkey"
  FOREIGN KEY ("nazivId") REFERENCES "NazivDobra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Nabavka" ADD CONSTRAINT "Nabavka_glasanjePredlogId_fkey"
  FOREIGN KEY ("glasanjePredlogId") REFERENCES "GlasanjePredlog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Objavljuju se SVE ponude, i one koje nisu izabrane — bez toga „najpovoljnija"
-- nije provera nego tvrdnja (čl. 15 st. 2).
CREATE TABLE "NabavkaPonuda" (
  "id"             TEXT NOT NULL,
  "nabavkaId"      TEXT NOT NULL,
  "ponudjac"       TEXT NOT NULL,
  "cenaPoJedinici" DECIMAL(12,2) NOT NULL,
  "izabrana"       BOOLEAN NOT NULL DEFAULT false,
  "napomena"       TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NabavkaPonuda_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NabavkaPonuda_nabavkaId_idx" ON "NabavkaPonuda"("nabavkaId");
ALTER TABLE "NabavkaPonuda" ADD CONSTRAINT "NabavkaPonuda_nabavkaId_fkey"
  FOREIGN KEY ("nabavkaId") REFERENCES "Nabavka"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- `poenSnimak` i `mesto` su SNIMAK u trenutku isteka roka za prijavu (čl. 22 st. 2).
-- Rolanje poziva traje danima; pri živom rangiranju red bi se premeštao pod nogama
-- onima koji čekaju poziv.
CREATE TABLE "NabavkaPrijava" (
  "id"             TEXT NOT NULL,
  "nabavkaId"      TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "status"         "NabavkaPrijavaStatus" NOT NULL DEFAULT 'PRIJAVLJEN',
  "poenSnimak"     INTEGER,
  "mesto"          INTEGER,
  "pozvanAt"       TIMESTAMP(3),
  "potvrdjenoAt"   TIMESTAMP(3),
  "danPreuzimanja" TIMESTAMP(3),
  "kod"            TEXT,
  "preuzetoAt"     TIMESTAMP(3),
  "rezervisano"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NabavkaPrijava_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NabavkaPrijava_kod_key" ON "NabavkaPrijava"("kod");
CREATE UNIQUE INDEX "NabavkaPrijava_nabavkaId_userId_key" ON "NabavkaPrijava"("nabavkaId", "userId");
CREATE INDEX "NabavkaPrijava_nabavkaId_status_idx" ON "NabavkaPrijava"("nabavkaId", "status");
CREATE INDEX "NabavkaPrijava_nabavkaId_mesto_idx" ON "NabavkaPrijava"("nabavkaId", "mesto");
CREATE INDEX "NabavkaPrijava_userId_idx" ON "NabavkaPrijava"("userId");
ALTER TABLE "NabavkaPrijava" ADD CONSTRAINT "NabavkaPrijava_nabavkaId_fkey"
  FOREIGN KEY ("nabavkaId") REFERENCES "Nabavka"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NabavkaPrijava" ADD CONSTRAINT "NabavkaPrijava_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 🔴 Projektni odliv NE ide u "FondacijaTrosak". `dohvatiTrosakPrethodnogMeseca()`
-- sabira sve redove tog modela, a prag za gašenje zaštitnog veta je `trosak × 3` —
-- nabavka od 200.000 RSD podigla bi prag za 600.000 RSD, pa bi se veto najteže
-- gasio baš u mesecima kada Fondacija najviše radi.
CREATE TABLE "ProjekatTrosak" (
  "id"        TEXT NOT NULL,
  "nabavkaId" TEXT,
  "datum"     DATE NOT NULL,
  "iznosRSD"  DECIMAL(12,2) NOT NULL,
  "opis"      TEXT NOT NULL,
  "kreiraoId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjekatTrosak_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjekatTrosak_nabavkaId_key" ON "ProjekatTrosak"("nabavkaId");
CREATE INDEX "ProjekatTrosak_datum_idx" ON "ProjekatTrosak"("datum");
ALTER TABLE "ProjekatTrosak" ADD CONSTRAINT "ProjekatTrosak_nabavkaId_fkey"
  FOREIGN KEY ("nabavkaId") REFERENCES "Nabavka"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjekatTrosak" ADD CONSTRAINT "ProjekatTrosak_kreiraoId_fkey"
  FOREIGN KEY ("kreiraoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Izborno glasanje: `za` postaje opciono, dodaje se `izbor`. Zatečeni glasovi su
-- svi za/protiv i ostaju netaknuti.
ALTER TABLE "GlasanjeGlas" ALTER COLUMN "za" DROP NOT NULL;
ALTER TABLE "GlasanjeGlas" ADD COLUMN "izbor" TEXT;
