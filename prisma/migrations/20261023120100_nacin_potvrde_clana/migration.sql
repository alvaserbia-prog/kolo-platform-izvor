-- Dokaz stvarnosti čl. 5a, 5c i 5d (set 4.8.3): način potvrde člana bez potvrde
-- (lično, telefonom, sa spiska povezanih) i potvrda uvodioca. Zatečeni redovi
-- ostaju null, odnosno false (pravilo 11).
CREATE TYPE "NacinPotvrdeClana" AS ENUM ('LICNO', 'TELEFONOM', 'SPISAK_POVEZANIH');
ALTER TABLE "PotvrdaClana" ADD COLUMN "nacin" "NacinPotvrdeClana";
ALTER TABLE "PotvrdaClana" ADD COLUMN "premaUvodiocu" BOOLEAN NOT NULL DEFAULT false;
