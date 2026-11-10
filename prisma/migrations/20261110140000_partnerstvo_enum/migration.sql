-- Set 5.1.2: partnerstvo (Pravilnik o pokroviteljstvu i donacijama Glava VI, čl. 43; Pravilnik
-- o KOLO sistemu čl. 19 st. 1 t. 4 i čl. 37 st. 5). Sopstveni tip emisije.
-- Nova vrednost enum-a ide u zaseban fajl (CLAUDE.md).
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EMISIJA_PARTNERSTVO';
