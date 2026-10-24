-- Nove vrednosti postojećih enuma, uz kolektivnu nabavku (set akata 4.4.1).
--
-- 🔴 ZASEBAN FAJL, bez ijedne upotrebe: Postgres ne dozvoljava da se vrednost
-- dodata u `ALTER TYPE ... ADD VALUE` koristi u istoj transakciji u kojoj je
-- dodata. Isti razlog zbog kog su i ranije razdvajane migracije okidača doprinosa
-- i tipova transakcija prijateljstva.

-- Poništenje zapisa POEN-a PO ISKORIŠĆENJU (Pravilnik čl. 14a). Poništava se
-- EMISIJA — Protokolov minus se smanjuje i opticaj opada. Nije PONISTENJE_PREPISA:
-- tamo se POEN seli između dva korisnička zapisa, ovde nestaje iz sistema.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'OTPIS_NABAVKA';

-- Izborno glasanje (Gornje Kolo čl. 8 st. 4). Predmet nabavke je dinarsko pitanje,
-- pa ovaj tip nikad ne ide u izvršenje po čl. 17.
ALTER TYPE "PredlogVrsta" ADD VALUE IF NOT EXISTS 'IZBOR_NABAVKE';
