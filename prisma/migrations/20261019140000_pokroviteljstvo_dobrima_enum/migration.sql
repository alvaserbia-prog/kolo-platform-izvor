-- Pokroviteljstvo dobrima i uslugama (Pravilnik o pokroviteljstvu i donacijama
-- Glava IVa; osmi osnov iz čl. 14 st. 3 t. 8 Pravilnika o KOLO sistemu).
-- Zaseban fajl: nova vrednost enum-a ne sme se koristiti u istoj migraciji.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EMISIJA_POKROVITELJ_DOBRA';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PONISTENJE_VAUCER';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ISPRAVKA_VAUCER';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'OTPIS_POKROVITELJ_DOBRA';
