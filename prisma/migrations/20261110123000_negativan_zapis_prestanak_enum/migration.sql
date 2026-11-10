-- Set 5.1.2: dvanaesti osnov negativnog zapisa (Pravilnik čl. 17 st. 2 t. 12, čl. 33 st. 7).
-- Nova vrednost enum-a ide u zaseban fajl (CLAUDE.md).
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PRENOS_NEGATIVNOG_ZAPISA';
