-- Pravilnik čl. 55 st. 3 (set 5.0): pseudonim se 10 godina posle prestanka statusa
-- zamenjuje oznakom koja ni posredno ne upućuje na lice. Kolona beleži trenutak zamene.
ALTER TABLE "User" ADD COLUMN "pseudonimAnonimizovanAt" TIMESTAMP(3);
