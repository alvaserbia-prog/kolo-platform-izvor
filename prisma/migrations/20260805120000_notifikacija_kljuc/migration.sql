-- Obaveštenja: čuvaj ključ + parametre uz gotov srpski tekst.
-- Postojeći redovi ostaju netaknuti (kljuc = NULL) i prikazuju se iz `naslov`/`tekst`,
-- pa nema potrebe za backfill-om ni rizika po istoriju.
ALTER TABLE "Notifikacija" ADD COLUMN "kljuc" TEXT;
ALTER TABLE "Notifikacija" ADD COLUMN "parametri" JSONB;
