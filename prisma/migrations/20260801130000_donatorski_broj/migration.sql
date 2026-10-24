-- Donatorski broj člana: trajni redni broj (osnova poziva na broj, model 97).
-- Backfill postojećih korisnika PO DATUMU REGISTRACIJE (najstariji = 1), pa tek
-- onda sekvenca + NOT NULL + UNIQUE. Novi nalozi dobijaju sledeći broj iz
-- sekvence automatski (Prisma @default(autoincrement())).

ALTER TABLE "User" ADD COLUMN "donatorskiBroj" INTEGER;

WITH numerisani AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "User"
)
UPDATE "User" u
SET "donatorskiBroj" = n.rn
FROM numerisani n
WHERE u.id = n.id;

CREATE SEQUENCE "User_donatorskiBroj_seq";
SELECT setval('"User_donatorskiBroj_seq"', COALESCE((SELECT MAX("donatorskiBroj") FROM "User"), 0) + 1, false);
ALTER TABLE "User" ALTER COLUMN "donatorskiBroj" SET DEFAULT nextval('"User_donatorskiBroj_seq"');
ALTER TABLE "User" ALTER COLUMN "donatorskiBroj" SET NOT NULL;
ALTER SEQUENCE "User_donatorskiBroj_seq" OWNED BY "User"."donatorskiBroj";

CREATE UNIQUE INDEX "User_donatorskiBroj_key" ON "User"("donatorskiBroj");
