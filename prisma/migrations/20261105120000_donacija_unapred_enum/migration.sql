-- Set 5.0.9 (donacije čl. 6, Pravilnik čl. 17 st. 2 t. 10): nove vrednosti enum-a idu u ZASEBAN fajl
-- pre fajla koji ih koristi (CLAUDE.md, migracije).
ALTER TYPE "TransactionType" ADD VALUE 'PONISTENJE_DONACIJE';
ALTER TYPE "TransactionType" ADD VALUE 'OTPIS_PRIMLJENOG_DONACIJA';
ALTER TYPE "DonationStatus" ADD VALUE 'NA_PROVERI';
ALTER TYPE "DonationStatus" ADD VALUE 'PONISTENO';
