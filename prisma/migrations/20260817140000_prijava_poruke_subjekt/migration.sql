-- Prijava poruke dobija SUBJEKT i ŠIFRU RAZLOGA.
--
-- Do sada je prijava hvatala samo poruku, uz opcion slobodan tekst. Opasnost je
-- gotovo uvek čovek, a ne pojedinačna poruka: tri prijave iz tri razgovora nad
-- istim nalogom su signal koji nijedna od tih poruka sama ne nosi. Zato prijava
-- od sada nosi i autora (`prijavljeniId`) i šifru sa zatvorene liste.
--
-- Poruka OSTAJE u prijavi — ona je dokaz. Bez nje bi Fondacija morala da pročita
-- celu sobu da bi shvatila šta se desilo, a to je nadzor koji je unapređeni model
-- namerno skinuo (roditelj razgovore dece više ne čita).
--
-- Uz to prijava dobija polja kojima se ZATVARA (`odluka`, `resioId`, `resenAt`).
-- Kolona `status` je postojala od početka, ali je ništa nije prevodilo iz
-- `OTVORENA` — prijava je odlazila u mejl adminu i ostajala otvorena zauvek.

CREATE TYPE "PrijavaPorukeRazlog" AS ENUM (
  'VREDJANJE',
  'TRAZI_SLIKE',
  'TRAZI_SUSRET',
  'LAZE_UZRAST',
  'NEPRIMEREN_SADRZAJ',
  'LICNI_PODACI',
  'PREVARA',
  'OSTALO'
);

ALTER TABLE "PrijavaPoruke"
  ADD COLUMN "razlogKod" "PrijavaPorukeRazlog" NOT NULL DEFAULT 'OSTALO',
  ADD COLUMN "odluka" TEXT,
  ADD COLUMN "resioId" TEXT,
  ADD COLUMN "resenAt" TIMESTAMP(3),
  ADD COLUMN "prijavljeniId" TEXT;

-- Backfill: subjekt zatečene prijave je autor prijavljene poruke. Kolona se tek
-- posle backfill-a zatvara kao NOT NULL — obrnut redosled bi oborio migraciju na
-- svakoj bazi koja već ima prijave.
UPDATE "PrijavaPoruke" p
   SET "prijavljeniId" = c."userId"
  FROM "ChatMessage" c
 WHERE c."id" = p."porukaId"
   AND p."prijavljeniId" IS NULL;

-- Prijava čija je poruka u međuvremenu obrisana (cron čisti Pričaonicu posle 30
-- dana) ne može da dobije subjekta i nema šta da se o njoj odluči.
DELETE FROM "PrijavaPoruke" WHERE "prijavljeniId" IS NULL;

ALTER TABLE "PrijavaPoruke" ALTER COLUMN "prijavljeniId" SET NOT NULL;

ALTER TABLE "PrijavaPoruke"
  ADD CONSTRAINT "PrijavaPoruke_prijavljeniId_fkey"
  FOREIGN KEY ("prijavljeniId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PrijavaPoruke_prijavljeniId_createdAt_idx"
  ON "PrijavaPoruke"("prijavljeniId", "createdAt" DESC);
