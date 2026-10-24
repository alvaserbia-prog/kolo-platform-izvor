-- C3 (čišćenje dual role modela): uklanjanje legacy Role enuma.
-- Admin se određuje preko tipKorisnika = 'POCETNI' (C1), članstvo u Krugu preko
-- KrugClanstvo (C2). Kolona "User"."role" i tip "Role" više nisu u upotrebi.
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";
