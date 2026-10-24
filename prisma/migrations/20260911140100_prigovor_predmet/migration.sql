-- Prigovor dobija PREDMET (Uslovi čl. 37a st. 3) — bez njega se o prigovoru na
-- prepis i na deo iz nabavke ne može odlučiti.
ALTER TABLE "PrigovorNaOdluku" ADD COLUMN "predmetId" TEXT;

-- Veza prijave razmene sa prigovorom kroz koji je otvorena + izjašnjenje druge
-- strane pre odluke (Pravilnik čl. 16 st. 10).
ALTER TABLE "PrijavaRazmene" ADD COLUMN "prigovorId" TEXT;
ALTER TABLE "PrijavaRazmene" ADD COLUMN "izjasnjenjeDo" TIMESTAMP(3);
ALTER TABLE "PrijavaRazmene" ADD COLUMN "odgovorProtiv" TEXT;
ALTER TABLE "PrijavaRazmene" ADD COLUMN "odgovorProtivAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "PrijavaRazmene_prigovorId_key" ON "PrijavaRazmene"("prigovorId");
ALTER TABLE "PrijavaRazmene" ADD CONSTRAINT "PrijavaRazmene_prigovorId_fkey"
  FOREIGN KEY ("prigovorId") REFERENCES "PrigovorNaOdluku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ispravka evidencije po prijavljenom nedostatku (nabavke čl. 30a).
ALTER TABLE "NabavkaPrijava" ADD COLUMN "ispravljenoAt" TIMESTAMP(3);
ALTER TABLE "NabavkaPrijava" ADD COLUMN "ispravljenoPoen" INTEGER;
