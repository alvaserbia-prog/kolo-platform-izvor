-- Nov enum za dokaz pristanka (ZZPL čl. 15 st. 1, set 4.6.3 — R-06).
--
-- 🔴 ZASEBAN FAJL, bez ijedne upotrebe: Postgres ne dozvoljava da se nova vrednost
-- enum-a koristi u istoj transakciji u kojoj je tip stvoren zajedno sa tabelom koja
-- ga koristi kad se enum dodaje postojećem tipu. Isti obrazac kao
-- `20260913120000_donacija_naplaceno` i `20260911140000_ispravka_nabavka_enum`.
CREATE TYPE "VrstaPristanka" AS ENUM ('USLOVI_KORISCENJA', 'POLITIKA_PRIVATNOSTI', 'KOLACICI_ANALITIKA');
