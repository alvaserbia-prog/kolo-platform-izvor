-- Nova vrednost enum-a DonationStatus: NAPLACENO (R-01, mera M-4a).
-- ZASEBAN FAJL, bez ijedne upotrebe: Postgres ne dozvoljava da se nova enum
-- vrednost koristi u istoj transakciji u kojoj je dodata.
ALTER TYPE "DonationStatus" ADD VALUE IF NOT EXISTS 'NAPLACENO' BEFORE 'CONFIRMED';
