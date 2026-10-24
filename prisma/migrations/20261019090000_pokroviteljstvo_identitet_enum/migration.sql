-- Pokroviteljstvo kao četvrti slučaj upisa u evidenciju identiteta (Pravilnik
-- čl. 31a st. 2 t. 4, set 4.7.3). Nova vrednost enum-a ide u zaseban fajl.
ALTER TYPE "IzvorIdentiteta" ADD VALUE IF NOT EXISTS 'POKROVITELJSTVO';
