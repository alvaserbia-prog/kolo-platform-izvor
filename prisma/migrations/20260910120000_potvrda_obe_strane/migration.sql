-- Potvrda postojanja deteta traži izjašnjenje OBE strane veze (Pravilnik o učešću
-- dece, čl. 6). Roditelj daje izjavu pod punom odgovornošću, potvrđivač se izjašnjava
-- u roku; neaktivnost bilo koje strane obara potvrdu.
ALTER TABLE "Roditeljstvo" ADD COLUMN "izjavaAt" TIMESTAMP(3);
ALTER TABLE "Roditeljstvo" ADD COLUMN "izjavaTekst" TEXT;
ALTER TABLE "Roditeljstvo" ADD COLUMN "izjavaRokDo" TIMESTAMP(3);
CREATE INDEX "Roditeljstvo_izjavaRokDo_idx" ON "Roditeljstvo"("izjavaRokDo");

-- Raspored podsetnika: poslednji poslat prag u danima do isteka.
ALTER TABLE "RoditeljstvoPotvrda" ADD COLUMN "podsetnikDana" INTEGER;

-- 🔴 Zatečene veze roditelj–dete NE dobijaju rok za izjavu.
-- Roditelj koji je nalog otvorio ili preuzeo pre ovog seta izvršio je radnju kojom
-- je odgovornost preuzeo, ali izjavu nije dao jer je tada nije ni bilo. Upisati mu
-- rok značilo bi oboriti mu potvrde zbog propusta koji nije mogao da izbegne;
-- upisati mu "izjavaAt" značilo bi tvrditi da je dao izjavu koju nije. Zato oba
-- polja ostaju prazna, a rok se ne primenjuje unazad (isto kao "ugovorTekst" kod
-- zatečenih donacija i "izjavaTekst" kod zatečenih prijava na zadatak).

-- Potvrda se vezuje za KONKRETNOG roditelja. Do sada je red nosio samo dete, pa je
-- pri isteku roka padala svaka potvrda tog potvrđivača svakom roditelju tog deteta.
ALTER TABLE "RoditeljstvoPotvrda" ADD COLUMN "roditeljId" TEXT;

-- Backfill: najstarija veza roditelj–dete. Kod dece sa dvoje roditelja to je onaj
-- koji je nalog otvorio odnosno prvi preuzeo — a upravo su njegovi potvrđivači i
-- dobili red, jer se red i stvarao iz njegovog lanca.
UPDATE "RoditeljstvoPotvrda" p
SET "roditeljId" = (
  SELECT r."roditeljId" FROM "Roditeljstvo" r
  WHERE r."deteId" = p."deteId"
  ORDER BY r."createdAt" ASC, r."id" ASC
  LIMIT 1
);

-- Redovi kojima veza roditelj–dete više ne postoji nemaju predmet.
DELETE FROM "RoditeljstvoPotvrda" WHERE "roditeljId" IS NULL;

ALTER TABLE "RoditeljstvoPotvrda" ALTER COLUMN "roditeljId" SET NOT NULL;

DROP INDEX IF EXISTS "RoditeljstvoPotvrda_deteId_potvrdjivacId_key";
CREATE UNIQUE INDEX "RoditeljstvoPotvrda_deteId_roditeljId_potvrdjivacId_key"
  ON "RoditeljstvoPotvrda"("deteId", "roditeljId", "potvrdjivacId");
CREATE INDEX "RoditeljstvoPotvrda_roditeljId_status_idx"
  ON "RoditeljstvoPotvrda"("roditeljId", "status");

ALTER TABLE "RoditeljstvoPotvrda"
  ADD CONSTRAINT "RoditeljstvoPotvrda_roditeljId_fkey"
  FOREIGN KEY ("roditeljId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
