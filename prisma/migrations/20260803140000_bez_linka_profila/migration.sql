-- Uklanjanje polja `linkProfila` sa kartice prepoznavanja (odluka vlasnika).
--
-- Zašto zasebna migracija umesto izmene one koja ga je dodala: prethodna
-- migracija je već zapisana i Prisma je proverava kontrolnom sumom — naknadna
-- izmena primenjene migracije obara `migrate deploy` na svakom okruženju koje ju
-- je već izvršilo. `DROP COLUMN IF EXISTS` je bezbedan u oba slučaja.
--
-- Nepovratno po sadržaju: kolona je nova i prazna u praksi, ali ako je negde
-- popunjena, podaci se ovim brišu. To je i svrha — link se više ne prikuplja.

ALTER TABLE "ZahtevZaJemstvo" DROP COLUMN IF EXISTS "linkProfila";
