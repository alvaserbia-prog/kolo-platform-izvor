-- Redni broj doprinosa je jedinstven u gazdinstvu (set 4.7.7): dva istovremena
-- odobrenja pristupanja ne smeju dobiti isto mesto, pa ni sedmi doprinos.
-- Provereno 19.10.2026: duplikata nema ni na testu ni na produkciji.
CREATE UNIQUE INDEX IF NOT EXISTS "DoprinosGazdinstva_gazdinstvoId_redniBroj_key"
  ON "DoprinosGazdinstva"("gazdinstvoId", "redniBroj");
