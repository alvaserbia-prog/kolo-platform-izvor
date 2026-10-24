-- Modul Deca — unapređeni model (Pravilnik o Modulu Deca, druga verzija).
--
-- Četiri izmene, sve posledica istog: dete više ne ulazi samo kroz roditeljski
-- profil, i u dečjem prostoru sada NASTAJU zapisi POEN-a.
--
--  1. `Roditeljstvo` — dva roditelja sa istim ovlašćenjima, umesto kolone
--     `User.roditeljId` koja je jednog činila nosiocem.
--  2. `RoditeljPoziv` — samostalna registracija deteta i preuzimanje naloga.
--  3. `Prijateljstvo` dobija isplatu i raskid.
--  4. `PrijavaPoruke` — dete prijavljuje poruku u Pričaonici, jer roditelj
--     razgovore dece više ne čita.

-- ─── 1. Roditeljstvo ────────────────────────────────────────────────────────

CREATE TABLE "Roditeljstvo" (
    "id" TEXT NOT NULL,
    "deteId" TEXT NOT NULL,
    "roditeljId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Roditeljstvo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Roditeljstvo_deteId_roditeljId_key" ON "Roditeljstvo"("deteId", "roditeljId");
CREATE INDEX "Roditeljstvo_deteId_idx" ON "Roditeljstvo"("deteId");
CREATE INDEX "Roditeljstvo_roditeljId_idx" ON "Roditeljstvo"("roditeljId");

ALTER TABLE "Roditeljstvo" ADD CONSTRAINT "Roditeljstvo_deteId_fkey"
  FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Roditeljstvo" ADD CONSTRAINT "Roditeljstvo_roditeljId_fkey"
  FOREIGN KEY ("roditeljId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Zatečene veze prelaze u novu tabelu PRE nego što kolona padne. Bez ovoga bi
-- zatečena deca ostala bez ijednog roditelja, tj. tiho pala u stanje „na čekanju"
-- i bila obrisana po isteku roka.
INSERT INTO "Roditeljstvo" ("id", "deteId", "roditeljId", "createdAt")
SELECT gen_random_uuid()::text, "id", "roditeljId", "createdAt"
FROM "User"
WHERE "roditeljId" IS NOT NULL;

DROP INDEX IF EXISTS "User_roditeljId_idx";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_roditeljId_fkey";
ALTER TABLE "User" DROP COLUMN "roditeljId";

-- Noćni posao punoletstva traži maloletne naloge po datumu rođenja.
CREATE INDEX "User_maloletan_datumRodjenja_idx" ON "User"("maloletan", "datumRodjenja");

-- ─── 2. Prelaz u punoletstvo ────────────────────────────────────────────────
--
-- Dva odvojena stuba: najava mesec dana ranije i sama obrada. Oba su NULL za sve
-- zatečene naloge — nijedan još nije prošao ni jedno ni drugo.
ALTER TABLE "User" ADD COLUMN "punoletstvoNajavaAt" TIMESTAMP(3),
                  ADD COLUMN "punoletstvoObradjenAt" TIMESTAMP(3);

-- ─── 3. Poziv roditelju ─────────────────────────────────────────────────────

CREATE TABLE "RoditeljPoziv" (
    "id" TEXT NOT NULL,
    "deteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "tokenDo" TIMESTAMP(3) NOT NULL,
    "brisanjeDo" TIMESTAMP(3) NOT NULL,
    "iskoriscenAt" TIMESTAMP(3),
    "odbijenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoditeljPoziv_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoditeljPoziv_deteId_key" ON "RoditeljPoziv"("deteId");
CREATE UNIQUE INDEX "RoditeljPoziv_token_key" ON "RoditeljPoziv"("token");
CREATE INDEX "RoditeljPoziv_email_idx" ON "RoditeljPoziv"("email");
CREATE INDEX "RoditeljPoziv_brisanjeDo_idx" ON "RoditeljPoziv"("brisanjeDo");

ALTER TABLE "RoditeljPoziv" ADD CONSTRAINT "RoditeljPoziv_deteId_fkey"
  FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 4. Prijateljstvo: isplata i raskid ─────────────────────────────────────
--
-- Zatečena prijateljstva ostaju NEISPLAĆENA (`poenIsplacen` = false). Namerno:
-- kanal do sada nije postojao, pa nema šta da se otpiše, a isplata će se izvršiti
-- redovnim putem čim obe strane budu aktivne.
ALTER TABLE "Prijateljstvo" ADD COLUMN "poenIsplacen" BOOLEAN NOT NULL DEFAULT false,
                            ADD COLUMN "isplacenAt" TIMESTAMP(3),
                            ADD COLUMN "raskinutAt" TIMESTAMP(3),
                            ADD COLUMN "raskinuoId" TEXT;

ALTER TABLE "Prijateljstvo" ADD CONSTRAINT "Prijateljstvo_raskinuoId_fkey"
  FOREIGN KEY ("raskinuoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 5. Prijava poruke u Pričaonici ─────────────────────────────────────────

CREATE TABLE "PrijavaPoruke" (
    "id" TEXT NOT NULL,
    "porukaId" TEXT NOT NULL,
    "prijaviocId" TEXT NOT NULL,
    "razlog" TEXT,
    "status" "PrijavaOglasaStatus" NOT NULL DEFAULT 'OTVORENA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrijavaPoruke_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrijavaPoruke_porukaId_prijaviocId_key" ON "PrijavaPoruke"("porukaId", "prijaviocId");
CREATE INDEX "PrijavaPoruke_status_createdAt_idx" ON "PrijavaPoruke"("status", "createdAt" DESC);

ALTER TABLE "PrijavaPoruke" ADD CONSTRAINT "PrijavaPoruke_porukaId_fkey"
  FOREIGN KEY ("porukaId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrijavaPoruke" ADD CONSTRAINT "PrijavaPoruke_prijaviocId_fkey"
  FOREIGN KEY ("prijaviocId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
