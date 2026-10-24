-- Odnos podnosioca prijave prema davaocu (donacije čl. 13e st. 1, set 4.7.8,
-- odluka vlasnika 20.10.2026). Enum ide u zaseban, raniji fajl od migracije koja
-- ga koristi (CLAUDE.md, Migracije).
CREATE TYPE "OdnosPremaDavaocu" AS ENUM ('ZASTUPNIK', 'PREDUZETNIK', 'VLASNIK', 'JEDAN_OD_VLASNIKA', 'STVARNI_VLASNIK', 'NOSILAC_GAZDINSTVA');
