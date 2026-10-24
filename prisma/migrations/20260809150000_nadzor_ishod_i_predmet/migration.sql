-- Nadzor verifikacija dobija ishod i nadzorni predmet.
-- Osnov: Pravilnik o dokazu stvarnosti 4.2.0, čl. 6, 7, 10, 11 i 11a.
--
-- Do 4.2.0 nadzornik je mogao samo da POTVRDI verifikaciju ili da ne uradi ništa.
-- Ko posumnja nije dobijao ništa i nije ostavljao trag, pa je podsticaj gurao ka
-- propuštanju. Sada svaki nadzor ostavlja zabeležen ishod, a sumnja otvara predmet.

-- 1. Ishod, subjekt sumnje i stanje predmeta.
--    CREATE TYPE (za razliku od ALTER TYPE ... ADD VALUE) sme da se koristi u istoj
--    transakciji u kojoj je i nastao, pa backfill niže može odmah da upiše vrednosti.
CREATE TYPE "NadzorIshod" AS ENUM ('UREDNO', 'ZA_PROVERU', 'SPORNO');
CREATE TYPE "NadzorSubjekt" AS ENUM ('VERIFIKATOR', 'VERIFIKOVANI', 'OBA', 'DEO_MREZE');
CREATE TYPE "NadzorniPredmetStatus" AS ENUM ('OTVOREN', 'UTVRDJENA_LAZNA', 'NEMA_OSNOVA');

-- 2. Merodavan ishod na samoj vezi (poslednji evidentirani).
ALTER TABLE "VerifikacionaVeza" ADD COLUMN "nadzorIshod" "NadzorIshod";

-- 3. Pun trag nadzora — jedan red po nadzorniku po verifikaciji.
--    Po ishodu "za proveru" zapis gleda više nadzornika, a jedno polje
--    `VerifikacionaVeza.nadzornikId` ne može da nosi dvoje ljudi.
--    Jedinstveni indeks je ono što sprovodi zabranu iz čl. 10 st. 4:
--    isti nadzornik ne sme dvaput da gleda isti zapis.
CREATE TABLE "NadzorZapis" (
    "id" TEXT NOT NULL,
    "verifikacijaId" TEXT NOT NULL,
    "nadzornikId" TEXT NOT NULL,
    "ishod" "NadzorIshod" NOT NULL,
    "subjekt" "NadzorSubjekt",
    "razlog" TEXT,
    "opis" TEXT,
    "poenEvidentiran" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NadzorZapis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NadzorZapis_verifikacijaId_nadzornikId_key" ON "NadzorZapis"("verifikacijaId", "nadzornikId");
CREATE INDEX "NadzorZapis_verifikacijaId_idx" ON "NadzorZapis"("verifikacijaId");
CREATE INDEX "NadzorZapis_nadzornikId_idx" ON "NadzorZapis"("nadzornikId");

-- Poništenjem verifikacije nestaje i nadzorni trag uz nju — nadzor deli sudbinu
-- verifikacije (čl. 20a); trag radnje ostaje u audit logu.
ALTER TABLE "NadzorZapis"
  ADD CONSTRAINT "NadzorZapis_verifikacijaId_fkey"
  FOREIGN KEY ("verifikacijaId") REFERENCES "VerifikacionaVeza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NadzorZapis"
  ADD CONSTRAINT "NadzorZapis_nadzornikId_fkey"
  FOREIGN KEY ("nadzornikId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Nadzorni predmet (čl. 11a) — alat, ne organ. Vidi ga samo superadmin.
--    Jedan po verifikaciji: drugi nadzornik koji doda ishod ažurira postojeći.
CREATE TABLE "NadzorniPredmet" (
    "id" TEXT NOT NULL,
    "verifikacijaId" TEXT NOT NULL,
    "status" "NadzorniPredmetStatus" NOT NULL DEFAULT 'OTVOREN',
    "subjekt" "NadzorSubjekt" NOT NULL,
    "razlog" TEXT NOT NULL,
    "opis" TEXT,
    "otvorenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resenById" TEXT,
    "resenAt" TIMESTAMP(3),
    "beleska" TEXT,

    CONSTRAINT "NadzorniPredmet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NadzorniPredmet_verifikacijaId_key" ON "NadzorniPredmet"("verifikacijaId");
CREATE INDEX "NadzorniPredmet_status_otvorenAt_idx" ON "NadzorniPredmet"("status", "otvorenAt");
CREATE INDEX "NadzorniPredmet_resenById_idx" ON "NadzorniPredmet"("resenById");

ALTER TABLE "NadzorniPredmet"
  ADD CONSTRAINT "NadzorniPredmet_verifikacijaId_fkey"
  FOREIGN KEY ("verifikacijaId") REFERENCES "VerifikacionaVeza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NadzorniPredmet"
  ADD CONSTRAINT "NadzorniPredmet_resenById_fkey"
  FOREIGN KEY ("resenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Utvrđenje da iza naloga ne stoji stvarna osoba (čl. 18, 20).
--    Nosilac kaskade: padaju sve verifikacije koje takav nalog dodiruju, i primljene
--    i obavljene. Kaskada staje na prvom nalogu koji nije ovako označen — stvaran
--    čovek gubi samo vezu ka lažnom nalogu, a sopstvene verifikacije zadržava.
ALTER TABLE "User" ADD COLUMN "utvrdjenNepostojeci" TIMESTAMP(3);

-- 6. Backfill zatečenih nadzora.
--    Do sada je popunjeno polje nadzornika značilo tačno jedno: nadzornik je
--    verifikaciju POTVRDIO i primio 500 POEN-a. To je ishod UREDNO.
UPDATE "VerifikacionaVeza"
   SET "nadzorIshod" = 'UREDNO'
 WHERE "nadzornikId" IS NOT NULL;

INSERT INTO "NadzorZapis" ("id", "verifikacijaId", "nadzornikId", "ishod", "poenEvidentiran", "createdAt")
SELECT gen_random_uuid()::text,
       v."id",
       v."nadzornikId",
       'UREDNO',
       true,
       COALESCE(v."nadzoranAt", v."vremenskiZig")
  FROM "VerifikacionaVeza" v
 WHERE v."nadzornikId" IS NOT NULL;
