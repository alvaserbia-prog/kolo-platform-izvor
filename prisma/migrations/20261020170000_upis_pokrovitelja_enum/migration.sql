-- Upis pokrovitelja u evidenciju (Pravilnik o pokroviteljstvu i donacijama čl. 6a,
-- set 4.7.8). Nova vrednost enum-a ide u ZASEBAN fajl, pre fajla koji je koristi.
DO $$ BEGIN
  CREATE TYPE "StatusUpisaPokrovitelja" AS ENUM ('NA_PROVERI', 'ODOBREN', 'ODBIJEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
