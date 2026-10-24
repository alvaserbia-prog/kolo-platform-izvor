-- R-04, mera M-5: opis ZRNO transakcija dobija prevodni ključ.
--
-- 🔴 Dva kvara u jednom redu, oba zatečena:
--   1. opis je glasio „Upis 100 ZRNA po KURSU 1.45" — jedino mesto u sistemu
--      gde je reč „kurs" još izlazila na ekran (istorija POEN-a i GDPR izvoz),
--      uz Pravilnik čl. 23 st. 4 koji kaže da koeficijent „nije kurs";
--   2. ZRNO nije bilo među devet oblika koje je prepoznala migracija
--      `20260805130000_transakcija_opis_kljuc`, pa se opis na svih pet jezika
--      prikazivao na srpskom.
--
-- 🟢 Istorija se NE prepravlja. `description` ostaje nepromenjen kao rezerva, a
-- prikaz ide preko `opisKljuc` (`api/novcanik/transakcije/route.ts`) — isti
-- postupak kojim je „Bonus za donaciju" prestao da se prikazuje uz R-01.
-- Red koji se ne prepozna ostaje sa `opisKljuc = NULL` i prikazuje se kao i pre.
--
-- Koeficijent je u opis upisivan preko `toFixed(2)`, dakle sa TAČKOM kao
-- decimalnim znakom („1.45"), ne zarezom — otud `[0-9.]+` u obrascu.

-- 1) "Upis <n> ZRNA po kursu <k>"
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.zrno_upis',
  "opisParametri" = jsonb_build_object(
    'zrna',        substring("description" from '^Upis ([0-9]+) ZRNA po kursu [0-9.]+$'),
    'koeficijent', substring("description" from '^Upis [0-9]+ ZRNA po kursu ([0-9.]+)$'))
WHERE "opisKljuc" IS NULL AND "description" ~ '^Upis [0-9]+ ZRNA po kursu [0-9.]+$';

-- 2) "Otpis <n> ZRNA po kursu <k>"
UPDATE "Transaction" SET "opisKljuc" = 'transakcije.zrno_otpis',
  "opisParametri" = jsonb_build_object(
    'zrna',        substring("description" from '^Otpis ([0-9]+) ZRNA po kursu [0-9.]+$'),
    'koeficijent', substring("description" from '^Otpis [0-9]+ ZRNA po kursu ([0-9.]+)$'))
WHERE "opisKljuc" IS NULL AND "description" ~ '^Otpis [0-9]+ ZRNA po kursu [0-9.]+$';
