-- Retroaktiva: doprinos sadržaju platforme za zatečene oglase.
-- Osnov: Pravilnik o KOLO sistemu 4.1.0 čl. 40a.
--
-- Kanal ne pravi razliku između oglasa objavljenog juče i oglasa objavljenog danas.
-- Ko je već ispunio Pijacu sopstvenom ponudom, doprinos je već dao — pa mu se ovde
-- BELEŽI. Ne evidentira se: zapis POEN-a nastaje tek kad nastupi okidač (verifikacija
-- ili ažuriranje evidencije POEN-a u korist tog korisnika, čl. 40a st. 3).
--
-- Zato ovo NE pravi skok opticaja na dan objave izmene. Postojeći članovi su već
-- verifikovani, pa im verifikacija kao okidač ne može nastupiti drugi put — njihov
-- doprinos čeka prvi primljen POEN. To je namerno.
--
-- Uslovi (isti kao u `oglasIspunjavaMinimum`):
--   ponuda · bar jedna fotografija · opis ≥ 40 znakova · kategorija · mesto
--
-- Uzima se NAJSTARIJI oglas koji ispunjava uslove („prvi oglas kojim nudi"), po
-- jednom korisniku (jedinstveni indeks nad "userId" to ionako čuva). Uklonjeni
-- oglasi (UKLONJEN) se preskaču — po čl. 40a st. 4 takav doprinos ne opstaje.

INSERT INTO "DoprinosSadrzaju" ("id", "userId", "oglasId", "iznos", "status", "zabelezenAt")
SELECT DISTINCT ON (o."sellerId")
  gen_random_uuid()::text,
  o."sellerId",
  o."id",
  1000,
  'ZABELEZEN',
  o."createdAt"
FROM "MarketplaceListing" o
JOIN "User" u ON u."id" = o."sellerId"
WHERE o."tip" = 'PONUDA'
  AND o."status" <> 'UKLONJEN'
  AND COALESCE(array_length(o."images", 1), 0) >= 1
  AND char_length(btrim(o."description")) >= 40
  AND COALESCE(btrim(o."category"), '') <> ''
  AND COALESCE(btrim(o."location"), '') <> ''
  AND u."deaktiviranAt" IS NULL
ORDER BY o."sellerId", o."createdAt" ASC
ON CONFLICT ("userId") DO NOTHING;
