-- Dokaz stvarnosti čl. 4a i 5c (set 4.8.3): zahtev člana bez potvrde za razgovor
-- radi potvrde. Nova vrednost enum-a ide u zaseban fajl.
ALTER TYPE "OsnovSpiska" ADD VALUE IF NOT EXISTS 'POTVRDA';
