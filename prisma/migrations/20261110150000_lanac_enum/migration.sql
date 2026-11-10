-- Set 5.1.2: program raspodele hrane i lanac proizvodnje i distribucije (nabavke Glave X i XI).
-- Nove vrednosti enum-a idu u zaseban fajl (CLAUDE.md); fajl koji ih koristi je naredni.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EMISIJA_PROGRAM_HRANE';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EMISIJA_LANAC';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PONISTENJE_VAUCER_LANAC';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ISPRAVKA_VAUCER_LANAC';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'OTPIS_NEPREUZETO_PROGRAM';
