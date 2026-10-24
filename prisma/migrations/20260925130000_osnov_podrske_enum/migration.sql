-- Osnov prava u programu Posebna podrška (Pravilnik o programima podrške čl. 12,
-- set 4.6.7). Dva osnova: smanjena sposobnost i gubitak doma.
--
-- 🔴 Tip se uvodi ZASEBNIM fajlom, pa se u narednom koristi. Pravilo iz CLAUDE.md
-- („nova vrednost enum-a ide u zaseban fajl") strogo važi za dodavanje vrednosti u
-- postojeći tip, koje Postgres ne dopušta u istoj transakciji sa upotrebom. Ovde je
-- reč o novom tipu, gde to ograničenje ne važi — ali se obrazac ne razlikuje bez
-- potrebe, jer bi sledeća vrednost ovog tipa ionako morala u svoj fajl.
CREATE TYPE "OsnovPodrske" AS ENUM ('SMANJENA_SPOSOBNOST', 'GUBITAK_DOMA');
