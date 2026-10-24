-- Javna vs anonimna donacija (Pravilnik o pokroviteljstvu i donacijama čl. 3, 5a).
-- Javna donacija → ime donatora u listi donacija + evidencija POEN-a.
-- Anonimna → bez imena i bez POEN-a.
--
-- DEFAULT true: postojeći zapisi ostaju javno=true da bi i dalje ulazili u
-- kumulativni nivo/rang (POEN im je već dodeljen). "Samo ubuduće" za PRIKAZ
-- imena obezbeđuje se zasebno — javna lista imena uslovljena je profilnim
-- prekidačem `prikaziPunoIme`, koji istorijski donatori nemaju uključen.
ALTER TABLE "DonationRecord" ADD COLUMN "javno" BOOLEAN NOT NULL DEFAULT true;
