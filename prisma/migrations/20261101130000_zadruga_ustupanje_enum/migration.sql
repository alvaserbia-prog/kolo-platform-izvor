-- Pravilnik o zadrugama 5.0.5, čl. 11 st. 1 t. 6: ustupanje zemljišta, opreme ili
-- mehanizacije zadruzi na korišćenje — sopstveni tip prepisa iz zapisa zadruge.
-- Zaseban fajl: nova vrednost enum-a ne koristi se u istoj migraciji.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ZADRUGA_USTUPANJE';
