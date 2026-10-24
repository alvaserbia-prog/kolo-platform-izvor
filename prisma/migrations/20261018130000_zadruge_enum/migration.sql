-- Modul Zadruga: osnovi zapisa zadruge (Pravilnik o zadrugama čl. 13) i
-- poništenje zapisa pri prestanku učešća (Pravilnik o KOLO sistemu čl. 56).
-- Zaseban fajl: nova vrednost enum-a ne sme se koristiti u istoj migraciji.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ZADRUGA_PRIJEM';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ZADRUGA_IZDAVANJE';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ZADRUGA_DOPRINOS';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ZADRUGA_OPREMA';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ZADRUGA_USLUGA';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PONISTENJE_ZAPISA_ZADRUGE';
