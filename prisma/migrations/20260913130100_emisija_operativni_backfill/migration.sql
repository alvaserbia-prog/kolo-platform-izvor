-- Backfill: zatečene emisije operativnog doprinosa prelaze na sopstveni tip.
--
-- 🔴 Smer backfill-a je izabran da GREŠKA BUDE BEZOPASNA. Prebacuje se
-- OPERATIVNI, a `EMISIJA_PROGRAM` ostaje socijalnim programima — pa red koji
-- backfill promaši ostaje `EMISIJA_PROGRAM` i biva SAKRIVEN iz javnog prikaza.
-- Obrnut smer (nov tip za socijalne) bi promašen red OTKRIO, a to je upravo
-- ono što se ovom merom sprečava.
UPDATE "Transaction"
SET "type" = 'EMISIJA_OPERATIVNI'
WHERE "type" = 'EMISIJA_PROGRAM'
  AND "description" = 'Program Operativni doprinos';
