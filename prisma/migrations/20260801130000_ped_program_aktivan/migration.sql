-- Operativni doprinos (PED) je aktivan kanal u svim okruženjima: kartica na
-- /programi i noćna emisija (izvrsiNocnuEmisiju) čitaju ovaj red, a prod seed
-- ga nikada nije ubacivao — bez njega se PED evidencije ne isplaćuju u ponoć.
INSERT INTO "ProtokolProgram" ("type", "isActive", "activatedAt", "updatedAt")
VALUES ('PED', true, NOW(), NOW())
ON CONFLICT ("type") DO UPDATE
SET "isActive"    = true,
    "activatedAt" = COALESCE("ProtokolProgram"."activatedAt", NOW()),
    "updatedAt"   = NOW();
