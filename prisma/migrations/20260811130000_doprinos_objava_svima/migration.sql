-- Doprinos sadržaju platforme se od sada evidentira SVAKOME u trenutku objave
-- kvalifikovanog oglasa, i korisniku čija stvarnost još nije potvrđena (čl. 40a).
-- Okidač `OBJAVA_VERIFIKOVAN` time gubi ograničenje iz svog imena, pa se preimenuje.
--
-- RENAME VALUE, a ne ADD VALUE: preimenovanje je transakciono (za razliku od
-- dodavanja vrednosti, koja se ne sme koristiti u istoj transakciji u kojoj je
-- dodata), a zatečeni redovi zadržavaju tačno značenje — i oni su nastali objavom.
ALTER TYPE "DoprinosOkidac" RENAME VALUE 'OBJAVA_VERIFIKOVAN' TO 'OBJAVA';
