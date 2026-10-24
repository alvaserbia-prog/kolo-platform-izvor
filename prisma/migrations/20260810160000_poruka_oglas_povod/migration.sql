-- Oglas povodom kog je razgovor pokrenut — prikaz u razgovoru.
--
-- Odvojeno od "OglasUpit", koji broji upite za korak 3 putanje razmene: ovo je
-- prikaz (sličica i link iznad poruke), ne merilo.
--
-- Povod ide u DVA koraka. Klik na „Kontaktiraj" upisuje ga na konverzaciju, gde
-- ČEKA — čovek često otvori razgovor pa napiše tek kasnije, iz liste razgovora,
-- kad je adresa sa oglasom odavno nestala. Prva poruka onoga ko nije vlasnik
-- oglasa ga troši i prenosi na samu poruku, gde ostaje trajno: konverzacija je
-- jedna po PARU ljudi, pa bi drugi oglas prebrisao prvi.
ALTER TABLE "Poruka" ADD COLUMN "oglasId" TEXT;
CREATE INDEX "Poruka_oglasId_idx" ON "Poruka"("oglasId");
ALTER TABLE "Poruka"
  ADD CONSTRAINT "Poruka_oglasId_fkey"
  FOREIGN KEY ("oglasId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Konverzacija" ADD COLUMN "povodOglasId" TEXT;
ALTER TABLE "Konverzacija"
  ADD CONSTRAINT "Konverzacija_povodOglasId_fkey"
  FOREIGN KEY ("povodOglasId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
