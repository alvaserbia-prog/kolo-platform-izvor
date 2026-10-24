-- Set 4.6.7, R-03: osnov na prijavi + veza zapisa POEN-a do prijave.
--
-- 1. `ProgramEnrollment.osnov` — od osnova zavisi TRAJANJE prava (čl. 12):
--    smanjena sposobnost podleže godišnjoj reviziji, gubitak doma traje dvanaest
--    meseci od događaja bez revizije. Osnov se ne prikazuje nijednom korisniku
--    (čl. 4 st. 5); ovde stoji zato što ga sprovođenje roka traži.
--
-- 2. `Transaction.enrollmentId` — čl. 4 st. 4 traži da se evidentiranje po programu
--    prikaže verifikovanim korisnicima uz NAZIV PROGRAMA. Naziv se izvodi iz
--    prijave, a ne upisuje u zapis: zapis je trajan i ide u GDPR izvoz, pa upisan
--    naziv se više nikad ne bi mogao suziti.
--
--    🔴 Zatečeni redovi ostaju NULL i ne popunjavaju se naknadno — veza koja nije
--    postojala u svom trenutku ne sme se izmisliti danas. Stariji zapisi zato ne
--    ulaze u pojedinačan prikaz, nego ostaju u dnevnom zbiru, kao i do sada.
--
--    ON DELETE SET NULL, nikad CASCADE: brisanjem prijave (prestanak svojstva
--    korisnika, čl. 34) gasi se prikaz, a zapis ostaje. Kaskadno brisanje zapisa
--    oborilo bi zero-sum.
ALTER TABLE "ProgramEnrollment" ADD COLUMN "osnov" "OsnovPodrske";

ALTER TABLE "Transaction" ADD COLUMN "enrollmentId" TEXT;

CREATE INDEX "Transaction_type_enrollmentId_idx" ON "Transaction"("type", "enrollmentId");

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
