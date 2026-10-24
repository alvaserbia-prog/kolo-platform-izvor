-- Set 4.8.2 — kolone, tabele i popuna. Tipovi su u 20261022000000_kolo_statusi_enum.
-- Idempotentno koliko Postgres dozvoljava (IF NOT EXISTS / DO blokovi), jer se
-- primenjena migracija posle ne sme menjati.

-- ─── User.potvrdjenAt (Pravilnik čl. 2, 28a, 29; dokaz stvarnosti čl. 3 st. 2) ──
-- Keš izveden iz grafa; posle ovoga ga piše samo `preracunajStatusNaloga()`.
-- Svi danas potvrđeni postaju član Kola; razvrstavanje zatečenih uvođenja ide
-- skriptom `scripts/prelaz-4-8-2-statusi.ts`.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "potvrdjenAt" TIMESTAMP(3);
UPDATE "User"
   SET "potvrdjenAt" = COALESCE("verifiedAt", CURRENT_TIMESTAMP)
 WHERE "potvrdjenAt" IS NULL
   AND "maloletan" = false
   AND (("verified" = true AND "indeksStvarnosti" >= 10) OR "jeOsnivac" = true);

-- ─── VerifikacionaVeza: vrsta verifikacije (dokaz stvarnosti čl. 5a, 6 al. 5) ──
-- Sve zatečene veze su potvrde (podrazumevana vrednost).
ALTER TABLE "VerifikacionaVeza" ADD COLUMN IF NOT EXISTS "vrsta" "VrstaVerifikacije" NOT NULL DEFAULT 'POTVRDA';
ALTER TABLE "VerifikacionaVeza" ADD COLUMN IF NOT EXISTS "verifikatorBezPotvrde" BOOLEAN NOT NULL DEFAULT false;

-- ─── PotvrdaClana (dokaz stvarnosti čl. 5a st. 3–5, čl. 19 st. 1) ─────────────
CREATE TABLE IF NOT EXISTS "PotvrdaClana" (
    "id" TEXT NOT NULL,
    "verifikacijaId" TEXT NOT NULL,
    "potvrdjeniId" TEXT NOT NULL,
    "izvor" "IzvorPotvrdeClana" NOT NULL,
    "potvrdioId" TEXT,
    "lanacOdId" TEXT,
    "korak" INTEGER,
    "obrazlozenje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "podlezeNadzoru" BOOLEAN NOT NULL,
    "nadzornikId" TEXT,
    "nadzoranAt" TIMESTAMP(3),
    "nadzorIshod" "NadzorIshod",
    "ponistenaAt" TIMESTAMP(3),
    "ponistioId" TEXT,
    "razlogPonistenja" TEXT,
    "aktivnaKljuc" TEXT,
    CONSTRAINT "PotvrdaClana_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PotvrdaClana_aktivnaKljuc_key" ON "PotvrdaClana"("aktivnaKljuc");
CREATE INDEX IF NOT EXISTS "PotvrdaClana_potvrdjeniId_idx" ON "PotvrdaClana"("potvrdjeniId");
CREATE INDEX IF NOT EXISTS "PotvrdaClana_potvrdioId_createdAt_idx" ON "PotvrdaClana"("potvrdioId", "createdAt");
CREATE INDEX IF NOT EXISTS "PotvrdaClana_podlezeNadzoru_nadzorIshod_idx" ON "PotvrdaClana"("podlezeNadzoru", "nadzorIshod");
DO $$ BEGIN
  ALTER TABLE "PotvrdaClana" ADD CONSTRAINT "PotvrdaClana_verifikacijaId_fkey" FOREIGN KEY ("verifikacijaId") REFERENCES "VerifikacionaVeza"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PotvrdaClana" ADD CONSTRAINT "PotvrdaClana_potvrdjeniId_fkey" FOREIGN KEY ("potvrdjeniId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PotvrdaClana" ADD CONSTRAINT "PotvrdaClana_potvrdioId_fkey" FOREIGN KEY ("potvrdioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PotvrdaClana" ADD CONSTRAINT "PotvrdaClana_lanacOdId_fkey" FOREIGN KEY ("lanacOdId") REFERENCES "PotvrdaClana"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Roditeljstvo.zaustavljenaAt (deca čl. 4e st. 2) ──────────────────────────
ALTER TABLE "Roditeljstvo" ADD COLUMN IF NOT EXISTS "zaustavljenaAt" TIMESTAMP(3);

-- ─── PotvrdaPostojanjaDeteta (deca čl. 6 st. 2–8, čl. 22a) ────────────────────
CREATE TABLE IF NOT EXISTS "PotvrdaPostojanjaDeteta" (
    "id" TEXT NOT NULL,
    "roditeljstvoId" TEXT,
    "deteId" TEXT NOT NULL,
    "roditeljId" TEXT NOT NULL,
    "trazenoAt" TIMESTAMP(3),
    "izvor" "IzvorPotvrdePostojanja",
    "potvrdioId" TEXT,
    "potvrdjenoAt" TIMESTAMP(3),
    "podlezeNadzoru" BOOLEAN NOT NULL DEFAULT false,
    "nadzornikId" TEXT,
    "nadzoranAt" TIMESTAMP(3),
    "nadzorIshod" "NadzorIshod",
    "ponistenaAt" TIMESTAMP(3),
    "ponistioId" TEXT,
    "aktivnaKljuc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PotvrdaPostojanjaDeteta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PotvrdaPostojanjaDeteta_aktivnaKljuc_key" ON "PotvrdaPostojanjaDeteta"("aktivnaKljuc");
CREATE INDEX IF NOT EXISTS "PotvrdaPostojanjaDeteta_deteId_idx" ON "PotvrdaPostojanjaDeteta"("deteId");
CREATE INDEX IF NOT EXISTS "PotvrdaPostojanjaDeteta_roditeljId_idx" ON "PotvrdaPostojanjaDeteta"("roditeljId");
CREATE INDEX IF NOT EXISTS "PotvrdaPostojanjaDeteta_potvrdioId_idx" ON "PotvrdaPostojanjaDeteta"("potvrdioId");
CREATE INDEX IF NOT EXISTS "PotvrdaPostojanjaDeteta_podlezeNadzoru_nadzorIshod_idx" ON "PotvrdaPostojanjaDeteta"("podlezeNadzoru", "nadzorIshod");
DO $$ BEGIN
  ALTER TABLE "PotvrdaPostojanjaDeteta" ADD CONSTRAINT "PotvrdaPostojanjaDeteta_roditeljstvoId_fkey" FOREIGN KEY ("roditeljstvoId") REFERENCES "Roditeljstvo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PotvrdaPostojanjaDeteta" ADD CONSTRAINT "PotvrdaPostojanjaDeteta_deteId_fkey" FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PotvrdaPostojanjaDeteta" ADD CONSTRAINT "PotvrdaPostojanjaDeteta_roditeljId_fkey" FOREIGN KEY ("roditeljId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PotvrdaPostojanjaDeteta" ADD CONSTRAINT "PotvrdaPostojanjaDeteta_potvrdioId_fkey" FOREIGN KEY ("potvrdioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── PrijavaRoditeljstva (deca čl. 4e) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PrijavaRoditeljstva" (
    "id" TEXT NOT NULL,
    "roditeljstvoId" TEXT,
    "deteId" TEXT NOT NULL,
    "roditeljId" TEXT NOT NULL,
    "podnosilacId" TEXT NOT NULL,
    "opis" TEXT NOT NULL,
    "status" "PrijavaRoditeljstvaStatus" NOT NULL DEFAULT 'OTVORENA',
    "odlucioId" TEXT,
    "odlucenoAt" TIMESTAMP(3),
    "obrazlozenje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrijavaRoditeljstva_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PrijavaRoditeljstva_status_createdAt_idx" ON "PrijavaRoditeljstva"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PrijavaRoditeljstva_deteId_idx" ON "PrijavaRoditeljstva"("deteId");
CREATE INDEX IF NOT EXISTS "PrijavaRoditeljstva_podnosilacId_idx" ON "PrijavaRoditeljstva"("podnosilacId");
DO $$ BEGIN
  ALTER TABLE "PrijavaRoditeljstva" ADD CONSTRAINT "PrijavaRoditeljstva_roditeljstvoId_fkey" FOREIGN KEY ("roditeljstvoId") REFERENCES "Roditeljstvo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrijavaRoditeljstva" ADD CONSTRAINT "PrijavaRoditeljstva_deteId_fkey" FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrijavaRoditeljstva" ADD CONSTRAINT "PrijavaRoditeljstva_podnosilacId_fkey" FOREIGN KEY ("podnosilacId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Spisak za poziv (dokaz stvarnosti čl. 4a; Uslovi čl. 16b) ───────────────
ALTER TABLE "ZahtevZaRazgovor" ADD COLUMN IF NOT EXISTS "osnov" "OsnovSpiska" NOT NULL DEFAULT 'ZAHTEV';
ALTER TABLE "ZahtevZaRazgovor" ALTER COLUMN "mesto" DROP NOT NULL;
ALTER TABLE "ZahtevZaRazgovor" ALTER COLUMN "opis" DROP NOT NULL;
ALTER TABLE "ZahtevZaRazgovor" ALTER COLUMN "dostupnost" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "ZapisOtvaranjaPoziva" (
    "id" TEXT NOT NULL,
    "pozvaniId" TEXT NOT NULL,
    "otvorioId" TEXT NOT NULL,
    "otvorenoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZapisOtvaranjaPoziva_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ZapisOtvaranjaPoziva_pozvaniId_idx" ON "ZapisOtvaranjaPoziva"("pozvaniId");
CREATE INDEX IF NOT EXISTS "ZapisOtvaranjaPoziva_otvorioId_idx" ON "ZapisOtvaranjaPoziva"("otvorioId");
DO $$ BEGIN
  ALTER TABLE "ZapisOtvaranjaPoziva" ADD CONSTRAINT "ZapisOtvaranjaPoziva_pozvaniId_fkey" FOREIGN KEY ("pozvaniId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ZapisOtvaranjaPoziva" ADD CONSTRAINT "ZapisOtvaranjaPoziva_otvorioId_fkey" FOREIGN KEY ("otvorioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Gazdinstva (gazd. čl. 4, 4a, 4b, 6a, 9, 9a, 12a) ─────────────────────────
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "smeClanoveOd" TIMESTAMP(3);
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "telefonZaRazgovor" TEXT;
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "razgovorObavljenAt" TIMESTAMP(3);
-- Zatečena gazdinstva već imaju članove — pravo im se ne oduzima (čl. 9a).
UPDATE "Gazdinstvo" SET "smeClanoveOd" = "createdAt" WHERE "smeClanoveOd" IS NULL;

CREATE TABLE IF NOT EXISTS "IzvodRpg" (
    "id" TEXT NOT NULL,
    "gazdinstvoId" TEXT NOT NULL,
    "sadrzaj" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "velicina" INTEGER NOT NULL,
    "otpremioId" TEXT NOT NULL,
    "otpremljenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IzvodRpg_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IzvodRpg_gazdinstvoId_key" ON "IzvodRpg"("gazdinstvoId");
DO $$ BEGIN
  ALTER TABLE "IzvodRpg" ADD CONSTRAINT "IzvodRpg_gazdinstvoId_fkey" FOREIGN KEY ("gazdinstvoId") REFERENCES "Gazdinstvo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "UpitIzjaveGazdinstva" (
    "id" TEXT NOT NULL,
    "gazdinstvoId" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "status" "UpitIzjaveStatus" NOT NULL DEFAULT 'CEKA',
    "upucenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rokDo" TIMESTAMP(3) NOT NULL,
    "odgovorAt" TIMESTAMP(3),
    CONSTRAINT "UpitIzjaveGazdinstva_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "UpitIzjaveGazdinstva_status_rokDo_idx" ON "UpitIzjaveGazdinstva"("status", "rokDo");
CREATE INDEX IF NOT EXISTS "UpitIzjaveGazdinstva_gazdinstvoId_idx" ON "UpitIzjaveGazdinstva"("gazdinstvoId");
DO $$ BEGIN
  ALTER TABLE "UpitIzjaveGazdinstva" ADD CONSTRAINT "UpitIzjaveGazdinstva_gazdinstvoId_fkey" FOREIGN KEY ("gazdinstvoId") REFERENCES "Gazdinstvo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "UpitIzjaveGazdinstva" ADD CONSTRAINT "UpitIzjaveGazdinstva_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "ClanGazdinstva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Doprinos gazdinstva se može ponovo steći (Pravilnik čl. 40c st. 3; gazd. čl. 7
-- st. 3, 12a st. 6): `userId` više nije jedinstven, živ doprinos drži `aktivanKljuc`.
ALTER TABLE "DoprinosGazdinstva" ADD COLUMN IF NOT EXISTS "aktivanKljuc" TEXT;
UPDATE "DoprinosGazdinstva"
   SET "aktivanKljuc" = "userId"
 WHERE "aktivanKljuc" IS NULL
   AND "status" IN ('ZABELEZEN', 'EVIDENTIRAN')
   AND "otpisanAt" IS NULL;
DROP INDEX IF EXISTS "DoprinosGazdinstva_userId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "DoprinosGazdinstva_aktivanKljuc_key" ON "DoprinosGazdinstva"("aktivanKljuc");
CREATE INDEX IF NOT EXISTS "DoprinosGazdinstva_userId_idx" ON "DoprinosGazdinstva"("userId");

-- ─── Nadzor: predmet je verifikacija, potvrda člana ili potvrda postojanja ─────
-- (dokaz stvarnosti čl. 5a st. 4, 10, 11a; deca čl. 6 st. 6)
ALTER TABLE "NadzorZapis" ALTER COLUMN "verifikacijaId" DROP NOT NULL;
ALTER TABLE "NadzorZapis" ADD COLUMN IF NOT EXISTS "potvrdaClanaId" TEXT;
ALTER TABLE "NadzorZapis" ADD COLUMN IF NOT EXISTS "potvrdaPostojanjaId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "NadzorZapis_potvrdaClanaId_nadzornikId_key" ON "NadzorZapis"("potvrdaClanaId", "nadzornikId");
CREATE UNIQUE INDEX IF NOT EXISTS "NadzorZapis_potvrdaPostojanjaId_nadzornikId_key" ON "NadzorZapis"("potvrdaPostojanjaId", "nadzornikId");
DO $$ BEGIN
  ALTER TABLE "NadzorZapis" ADD CONSTRAINT "NadzorZapis_potvrdaClanaId_fkey" FOREIGN KEY ("potvrdaClanaId") REFERENCES "PotvrdaClana"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "NadzorZapis" ADD CONSTRAINT "NadzorZapis_potvrdaPostojanjaId_fkey" FOREIGN KEY ("potvrdaPostojanjaId") REFERENCES "PotvrdaPostojanjaDeteta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "NadzorZapis" ADD CONSTRAINT "NadzorZapis_jedan_predmet_check"
    CHECK (num_nonnulls("verifikacijaId", "potvrdaClanaId", "potvrdaPostojanjaId") = 1);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "NadzorniPredmet" ALTER COLUMN "verifikacijaId" DROP NOT NULL;
ALTER TABLE "NadzorniPredmet" ADD COLUMN IF NOT EXISTS "potvrdaClanaId" TEXT;
ALTER TABLE "NadzorniPredmet" ADD COLUMN IF NOT EXISTS "potvrdaPostojanjaId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "NadzorniPredmet_potvrdaClanaId_key" ON "NadzorniPredmet"("potvrdaClanaId");
CREATE UNIQUE INDEX IF NOT EXISTS "NadzorniPredmet_potvrdaPostojanjaId_key" ON "NadzorniPredmet"("potvrdaPostojanjaId");
DO $$ BEGIN
  ALTER TABLE "NadzorniPredmet" ADD CONSTRAINT "NadzorniPredmet_potvrdaClanaId_fkey" FOREIGN KEY ("potvrdaClanaId") REFERENCES "PotvrdaClana"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "NadzorniPredmet" ADD CONSTRAINT "NadzorniPredmet_potvrdaPostojanjaId_fkey" FOREIGN KEY ("potvrdaPostojanjaId") REFERENCES "PotvrdaPostojanjaDeteta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "NadzorniPredmet" ADD CONSTRAINT "NadzorniPredmet_jedan_predmet_check"
    CHECK (num_nonnulls("verifikacijaId", "potvrdaClanaId", "potvrdaPostojanjaId") = 1);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pravilnik o programima podrške čl. 4 st. 2: potvrda ispunjenosti uslova od Fondacije.
ALTER TABLE "ProgramPotvrda" ADD COLUMN IF NOT EXISTS "odFondacije" BOOLEAN NOT NULL DEFAULT false;
