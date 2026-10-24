-- Zakljucavanje liste osnivaca: admin eksplicitno zakljucava listu kad je
-- zbir udela tacno 1/1; emisija koraka ide samo nad zakljucanom listom.
ALTER TABLE "OsnivackiKanal" ADD COLUMN "osnivaciZakljucani" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OsnivackiKanal" ADD COLUMN "osnivaciZakljucaniAt" TIMESTAMP(3);

-- Baza podignuta bez migracionog SQL-a moze biti bez singleton reda — dopuni ga.
INSERT INTO "OsnivackiKanal" (id, "updatedAt") VALUES ('singleton', NOW())
ON CONFLICT (id) DO NOTHING;
