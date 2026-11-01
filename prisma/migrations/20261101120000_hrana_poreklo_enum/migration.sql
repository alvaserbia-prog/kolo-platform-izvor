-- Set 5.0.2: vrsta i poreklo hrane (donacije čl. 22 st. 4). Novi tipovi u zasebnom fajlu.
DO $$ BEGIN
  CREATE TYPE "VrstaHrane" AS ENUM ('ZIVOTINJSKA', 'BILJNA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "PorekloHrane" AS ENUM ('GAZDINSTVO', 'MALA_FARMA', 'INDUSTRIJA', 'PRERADJENO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
