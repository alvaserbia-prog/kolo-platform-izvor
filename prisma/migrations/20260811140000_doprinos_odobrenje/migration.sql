-- Doprinos za prvi oglas naloga BEZ POTVRDE evidentira se kad ga Fondacija odobri
-- (čl. 40a st. 4). Oglas ide na Pijacu odmah; 1.000 POEN čeka admina.
--
-- ADD VALUE je u zasebnom fajlu od preimenovanja iz prethodne migracije, i nova
-- vrednost se u ovoj migraciji NE koristi — Postgres ne dozvoljava upotrebu
-- vrednosti enuma u istoj transakciji u kojoj je dodata.
ALTER TYPE "DoprinosOkidac" ADD VALUE IF NOT EXISTS 'ODOBRENJE';
