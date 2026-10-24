-- Istorija transakcija: uz gotov srpski opis čuvaj ključ + parametre, da bi se
-- opis mogao prikazati na jeziku posmatrača.
--
-- `description` OSTAJE popunjen (rezerva), pa nijedan postojeći prikaz ne puca.
-- Backfill ispod prepoznaje devet oblika koje je kod do sada upisivao. Red koji
-- se ne prepozna ostaje sa `opisKljuc = NULL` i prikazuje se kao i pre —
-- namerno, jer je pogrešno protumačen opis gori od neprevedenog.
ALTER TABLE "Transaction" ADD COLUMN "opisKljuc" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "opisParametri" JSONB;

-- 1) "Verifikacija <pseudonim>"
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.verifikacija',
  "opisParametri" = jsonb_build_object('pseudonim', substring("description" from '^Verifikacija (.+)$'))
WHERE "description" ~ '^Verifikacija .+$';

-- 2) "Primljena verifikacija od <pseudonim>"
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.primljena_verifikacija',
  "opisParametri" = jsonb_build_object('pseudonim', substring("description" from '^Primljena verifikacija od (.+)$'))
WHERE "description" ~ '^Primljena verifikacija od .+$';

-- 3) "Nadzor verifikacije <a> → <b>"
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.nadzor',
  "opisParametri" = jsonb_build_object(
    'verifikator', substring("description" from '^Nadzor verifikacije (.+) → .+$'),
    'verifikovani', substring("description" from '^Nadzor verifikacije .+ → (.+)$'))
WHERE "description" ~ '^Nadzor verifikacije .+ → .+$';

-- 4) "Bonus za donaciju iznos <n>"  (iznos ostaje TEKST: već je formatiran srpski,
--    a prevod ga ne preračunava — vidi napomenu u planu)
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.donacija',
  "opisParametri" = jsonb_build_object('iznos', substring("description" from '^Bonus za donaciju iznos (.+)$'))
WHERE "description" ~ '^Bonus za donaciju iznos .+$';

-- 5) "Bonus za pokroviteljstvo iznos <n>"
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.pokroviteljstvo',
  "opisParametri" = jsonb_build_object('iznos', substring("description" from '^Bonus za pokroviteljstvo iznos (.+)$'))
WHERE "description" ~ '^Bonus za pokroviteljstvo iznos .+$';

-- 6) "Osnivacki doprinos — korak <a>/<b>"
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.osnivacki',
  "opisParametri" = jsonb_build_object(
    'korak', substring("description" from '^Osnivacki doprinos — korak (\d+)/\d+$'),
    'ukupno', substring("description" from '^Osnivacki doprinos — korak \d+/(\d+)$'))
WHERE "description" ~ '^Osnivacki doprinos — korak \d+/\d+$';

-- 7) 'Bonus krugovi "<ime>" — <n> članova'
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.krug_bonus',
  "opisParametri" = jsonb_build_object(
    'krug', substring("description" from '^Bonus krugovi "(.+)" — \d+ članova$'),
    'clanovi', substring("description" from '^Bonus krugovi ".+" — (\d+) članova$'))
WHERE "description" ~ '^Bonus krugovi ".+" — \d+ članova$';

-- 8) 'Osnivanje krugovi "<ime>"'
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.krug_osnivanje',
  "opisParametri" = jsonb_build_object('krug', substring("description" from '^Osnivanje krugovi "(.+)"$'))
WHERE "description" ~ '^Osnivanje krugovi ".+"$';

-- 9) "Program <naziv>" — naziv programa je i sam prevodiv, pa se čuva kao ključ
--    tipa programa gde je prepoznatljiv; inače ostaje tekst.
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.program',
  "opisParametri" = jsonb_build_object('program', substring("description" from '^Program (.+)$'))
WHERE "description" ~ '^Program .+$';
