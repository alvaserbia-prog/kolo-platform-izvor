-- Set 4.8.2 — statusi učesnika, potvrda i uvođenje, spisak za poziv, deca,
-- gazdinstva. Samo NOVI tipovi; kolone koje ih koriste idu u sledeći fajl
-- (20261022000100_kolo_statusi). Postojeći enum-i se ne proširuju.
-- Idempotentno: CREATE TYPE nema IF NOT EXISTS, pa ide kroz DO blok.

-- Dokaz stvarnosti čl. 5a st. 1: vrsta verifikacije (potvrda / uvođenje u Kolo).
DO $$ BEGIN
  CREATE TYPE "VrstaVerifikacije" AS ENUM ('POTVRDA', 'UVODJENJE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Dokaz stvarnosti čl. 5a st. 3–5: ko je potvrdio člana bez potvrde.
DO $$ BEGIN
  CREATE TYPE "IzvorPotvrdeClana" AS ENUM ('CLAN_KOLA', 'FONDACIJA', 'LANAC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Dokaz stvarnosti čl. 4a st. 2: osnov ulaska na spisak za poziv.
DO $$ BEGIN
  CREATE TYPE "OsnovSpiska" AS ENUM ('ZAHTEV', 'DONACIJA', 'POKROVITELJSTVO', 'GAZDINSTVO_RPG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pravilnik o učešću dece čl. 6, 22a: odakle potvrda postojanja deteta.
DO $$ BEGIN
  CREATE TYPE "IzvorPotvrdePostojanja" AS ENUM ('CLAN_KOLA', 'ZATECENA', 'OSNIVAC_PRELAZNA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pravilnik o učešću dece čl. 4e: prijava lažnog roditeljstva.
DO $$ BEGIN
  CREATE TYPE "PrijavaRoditeljstvaStatus" AS ENUM ('OTVORENA', 'NEMA_OSNOVA', 'UKINUTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pravilnik o gazdinstvima čl. 9 st. 3, 11 st. 6: upit za preuzimanje izjave.
DO $$ BEGIN
  CREATE TYPE "UpitIzjaveStatus" AS ENUM ('CEKA', 'PREUZETA', 'ODBIJENA', 'ISTEKLA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
