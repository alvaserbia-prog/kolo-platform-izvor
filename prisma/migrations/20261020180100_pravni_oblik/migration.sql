-- Donacije čl. 6a st. 2 (set 4.7.8): pravni oblik pokrovitelja. Zatečeni upisi ostaju NULL.
DO $$ BEGIN
  CREATE TYPE "PravniOblik" AS ENUM ('PRIVREDNO_DRUSTVO', 'PREDUZETNIK', 'UDRUZENJE', 'ZADRUGA', 'USTANOVA', 'DRUGO_PRAVNO_LICE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "UpisPokrovitelja" ADD COLUMN IF NOT EXISTS "pravniOblik" "PravniOblik";
