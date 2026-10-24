-- Gazdinstva (Pravilnik o KOLO sistemu čl. 40c, sedmi osnov iz čl. 14 st. 3 t. 7).
-- Zaseban fajl: nova vrednost enum-a ne sme se koristiti u istoj migraciji.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EMISIJA_GAZDINSTVO';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'OTPIS_GAZDINSTVO';
