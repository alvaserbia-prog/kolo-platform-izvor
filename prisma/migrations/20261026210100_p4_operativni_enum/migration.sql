-- Operativni doprinos 5.0 (čl. 15 st. 2 t. 3): uslovna potvrda izvršenja celina —
-- izjašnjavanje se odlaže do dopune dokaza. Nova vrednost enum-a ide u zaseban fajl,
-- pre fajla koji je koristi (CLAUDE.md, migracije).
ALTER TYPE "EvidencijaStatus" ADD VALUE IF NOT EXISTS 'DOPUNA';
