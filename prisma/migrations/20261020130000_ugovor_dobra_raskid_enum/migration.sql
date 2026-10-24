-- Raskid ugovora o pokroviteljstvu dobrima i uslugama po neizvršenju (donacije čl. 13j, set 4.7.8).
-- Nova vrednost enum-a ide u zaseban fajl (CLAUDE.md, Migracije).
ALTER TYPE "UgovorDobraStatus" ADD VALUE IF NOT EXISTS 'RASKINUT';
