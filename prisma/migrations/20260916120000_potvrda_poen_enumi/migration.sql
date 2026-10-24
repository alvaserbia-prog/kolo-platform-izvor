-- POEN po potvrdi čeka trag stvarnog učešća (dokaz stvarnosti čl. 7, set 4.6.4).
--
-- 🔴 ZASEBAN FAJL, bez ijedne upotrebe: Postgres ne dozvoljava da se nova vrednost
-- enum-a koristi u istoj transakciji u kojoj je tip stvoren. Isti obrazac kao
-- `20260914120000_vrsta_pristanka_enum`, `20260913120000_donacija_naplaceno` i
-- `20260911140000_ispravka_nabavka_enum`.
CREATE TYPE "PotvrdaPoenStatus" AS ENUM ('ZABELEZEN', 'EVIDENTIRAN', 'PONISTEN');
CREATE TYPE "PotvrdaPoenUslov" AS ENUM ('OGLAS', 'DONACIJA', 'POKROVITELJSTVO', 'OPERATIVNI');
