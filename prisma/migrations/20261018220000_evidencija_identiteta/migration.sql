-- Evidencija identiteta (Pravilnik o KOLO sistemu čl. 31a, set 4.7.3): zasebna
-- evidencija pseudonim → ime i prezime, jedan zapis po nalogu. Ne ulazi u
-- evidenciju doprinosa. JMBG se ne upisuje.
DO $$ BEGIN
  CREATE TYPE "IzvorIdentiteta" AS ENUM ('GAZDINSTVO', 'DONACIJA', 'ZADRUGA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "IdentitetNaloga" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imePrezime" TEXT NOT NULL,
    "izvor" "IzvorIdentiteta" NOT NULL,
    "upisanAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IdentitetNaloga_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IdentitetNaloga_userId_key" ON "IdentitetNaloga"("userId");

DO $$ BEGIN
  ALTER TABLE "IdentitetNaloga" ADD CONSTRAINT "IdentitetNaloga_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pravilnik o gazdinstvima čl. 6 st. 4: beleži se samo da je ime podnosioca i
-- BPG upoređeno sa izvodom iz RPG; izvod se ne čuva.
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "rpgUporedjenAt" TIMESTAMP(3);
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "rpgUporedioId" TEXT;

-- 🔴 Zatečena imena se NE prenose (CLAUDE.md pravilo 11): ime zadrugara dato uz
-- pristanak za zadrugu, ime uz javnu donaciju i dobrovoljno ime sa profila ostaju
-- gde su; evidencija identiteta se puni tek novim upisima.
