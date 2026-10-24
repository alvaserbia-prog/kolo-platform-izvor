-- C1 (čišćenje dual role modela): Admin (UO Fondacije) je kanonski POCETNI tip korisnika.
-- Posle prelaska autorizacije sa Role enuma na tipKorisnika, admin pristup se
-- određuje preko tipKorisnika = 'POCETNI'. Ova migracija prebacuje sve postojeće
-- ADMIN naloge na POCETNI da ne izgube pristup (npr. prod admin koji je do sada
-- imao podrazumevani tip NEVERIFIKOVAN).
UPDATE "User" SET "tipKorisnika" = 'POCETNI' WHERE "role" = 'ADMIN' AND "tipKorisnika" <> 'POCETNI';
