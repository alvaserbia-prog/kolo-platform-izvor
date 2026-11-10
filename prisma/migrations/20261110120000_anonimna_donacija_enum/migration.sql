-- Set 5.1.2 (donacije čl. 12, Pravilnik čl. 17 st. 2 t. 11): nova vrednost enum-a ide u ZASEBAN
-- fajl pre fajla koji je koristi (CLAUDE.md, migracije).
ALTER TYPE "TransactionType" ADD VALUE 'PONISTENJE_ANONIMNA_DONACIJA';
