-- Zbir isplaćenog POEN-a po prijavi na socijalni program (R-03, mera M-1).
--
-- 🔴 REDOSLED JE BITAN: ova migracija mora da prođe PRE
-- `20260913130200_opisi_bez_posebnih_kategorija`, koja iz opisa briše naziv
-- programa. Backfill se izvodi upravo iz tih opisa — posle brisanja veza
-- transakcija ↔ program više ne postoji i istorijski zbir se ne može obnoviti.
ALTER TABLE "ProgramEnrollment" ADD COLUMN "isplacenoPoen" INTEGER NOT NULL DEFAULT 0;

-- Backfill: svaka zatečena emisija socijalnog programa pripisuje se prijavi istog
-- korisnika na program koji joj opis imenuje.
UPDATE "ProgramEnrollment" e
SET "isplacenoPoen" = COALESCE(z.zbir, 0)
FROM (
  SELECT w."userId" AS user_id, t."description" AS opis, SUM(t."amount")::int AS zbir
    FROM "Transaction" t
    JOIN "Wallet" w ON w."id" = t."toWalletId"
   WHERE t."type" = 'EMISIJA_PROGRAM'
     AND w."userId" IS NOT NULL
   GROUP BY w."userId", t."description"
) z
WHERE z.user_id = e."userId"
  AND z.opis = 'Program ' || CASE e."type"
        WHEN 'PODRSKA_MAJKAMA'   THEN 'Podrška majkama'
        WHEN 'PODRSKA_STARIJIMA' THEN 'Podrška starijima'
        WHEN 'POSEBNA_BRIGA'     THEN 'Posebna briga'
        WHEN 'SKOLOVANJE'        THEN 'Školovanje'
      END;
