-- Email obaveštenja korisnicima (opt-out) + token za odjavu jednim klikom.
--
-- `emailObavestenja` je podrazumevano UKLJUČENO: korisnik već ima nalog i
-- očekuje obaveštenje o verifikaciji, poruci ili odluci po prijavi. Gasi se u
-- profilu ili linkom iz podnožja mejla. Reset lozinke NE zavisi od ove kolone.
--
-- `emailOdjavaToken` se ne backfiluje — generiše se lenjo pri prvom slanju
-- (vidi `dohvatiOdjavaToken` u src/lib/email.ts), pa nalozi koji nikad ne dobiju
-- mejl ostaju bez tokena.

ALTER TABLE "User" ADD COLUMN "emailObavestenja" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailOdjavaToken" TEXT;

CREATE UNIQUE INDEX "User_emailOdjavaToken_key" ON "User"("emailOdjavaToken");
