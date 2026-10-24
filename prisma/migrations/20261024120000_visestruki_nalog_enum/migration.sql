-- Registar 2026-10, N4 (set 4.8.4): osmi osnov negativnog zapisa i peti slučaj upisa
-- u evidenciju identiteta. Nova vrednost enum-a ide u zaseban fajl (CLAUDE.md).
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'OTPIS_VISESTRUKI_NALOG';
ALTER TYPE "IzvorIdentiteta" ADD VALUE IF NOT EXISTS 'SPISAK_ZA_POZIV';
