-- R-03: iz zatečenih opisa transakcija izlaze ime uplatioca i naziv programa.
--
-- 🔴 Nije dovoljno promeniti ono što se od sada upisuje. `Transaction.description`
-- je trajan zapis koji se servira u `/api/javno/feed`, u props stranice `/sistem`
-- i u GDPR izvozu (`/api/profil/eksport`) — dakle zatečeni redovi bi i dalje
-- nosili posebnu kategoriju i ime donatora.

-- 1) Ime uplatioca iz opisa donacije (mera M-3b). Skida se sufiks
--    „ — uplatilac: <ime>"; iznos i osnov ostaju.
UPDATE "Transaction"
SET "description"  = split_part("description", ' — uplatilac: ', 1),
    "opisKljuc"    = 'transakcije.donacija',
    "opisParametri" = "opisParametri" - 'uplatilac'
WHERE "type" = 'EMISIJA_DONACIJA'
  AND "description" LIKE '% — uplatilac: %';

-- 2) Naziv socijalnog programa iz opisa (mera M-1). Operativni doprinos je
--    prethodnom migracijom već prešao na `EMISIJA_OPERATIVNI` i ne dira se.
UPDATE "Transaction"
SET "description"  = 'Socijalni program',
    "opisKljuc"    = 'transakcije.socijalni_program',
    "opisParametri" = NULL
WHERE "type" = 'EMISIJA_PROGRAM';
