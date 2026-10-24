-- Upis pokrovitelja u evidenciju (Pravilnik o pokroviteljstvu i donacijama čl. 6a,
-- set 4.7.8) i izjava o adresi gazdinstva na mapi (Pravilnik o gazdinstvima čl. 4
-- t. 3 i čl. 11, dopuna 20.10.2026).
--
-- Bez brisanja: zatečene kolone ostaju (prijave i ugovori nose SNIMAK podataka o
-- pokrovitelju), nove veze su NULL-abilne i popunjavaju se ovde gde je to
-- jednoznačno (po PIB-u, matičnom broju, odnosno BPG-u).

-- ─── Kolone ──────────────────────────────────────────────────────────────────
ALTER TABLE "Pokrovitelj" ADD COLUMN IF NOT EXISTS "upisId" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "upisId" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN IF NOT EXISTS "upisId" TEXT;
ALTER TABLE "DavalacZaposleni" ADD COLUMN IF NOT EXISTS "upisId" TEXT;
ALTER TABLE "ZabranaDavaoca" ADD COLUMN IF NOT EXISTS "upisId" TEXT;
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "izjavaAdresaAt" TIMESTAMP(3);
ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "obrisanoAt" TIMESTAMP(3);

-- ─── Tabela ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UpisPokrovitelja" (
    "id" TEXT NOT NULL,
    "vrsta" "VrstaDavaoca" NOT NULL,
    "status" "StatusUpisaPokrovitelja" NOT NULL DEFAULT 'NA_PROVERI',
    "vlasnikUserId" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "adresaSedista" TEXT,
    "maticniBroj" TEXT,
    "pib" TEXT,
    "bpg" TEXT,
    "gazdinstvoId" TEXT,
    "imePrezime" TEXT,
    "zastupnikFunkcija" TEXT,
    "odnosPremaDavaocu" "OdnosPremaDavaocu",
    "kontaktEmail" TEXT,
    "kontaktTelefon" TEXT,
    "logoUrl" TEXT,
    "mapaMesto" TEXT,
    "mapaAdresa" TEXT,
    "mapaLat" DOUBLE PRECISION,
    "mapaLng" DOUBLE PRECISION,
    "izjavaAdresaAt" TIMESTAMP(3),
    "izjavaOvlascenjaAt" TIMESTAMP(3),
    "potvrdaEvidentiranjaAt" TIMESTAMP(3),
    "potvrdaEvidentiranjaTekst" TEXT,
    "aprProveraAt" TIMESTAMP(3),
    "aprProverioId" TEXT,
    "odlukaAt" TIMESTAMP(3),
    "odlukaAdminId" TEXT,
    "odbijenoRazlog" TEXT,
    "izmenaNaziv" TEXT,
    "izmenaMaticniBroj" TEXT,
    "izmenaLogoUrl" TEXT,
    "izmenaPodnetaAt" TIMESTAMP(3),
    "izmenaOdbijenaRazlog" TEXT,
    "obrisanAt" TIMESTAMP(3),
    "uklonjenSaRangListeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpisPokrovitelja_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UpisPokrovitelja_vlasnikUserId_idx" ON "UpisPokrovitelja"("vlasnikUserId");
CREATE INDEX IF NOT EXISTS "UpisPokrovitelja_status_idx" ON "UpisPokrovitelja"("status");
CREATE INDEX IF NOT EXISTS "UpisPokrovitelja_maticniBroj_idx" ON "UpisPokrovitelja"("maticniBroj");
CREATE INDEX IF NOT EXISTS "UpisPokrovitelja_bpg_idx" ON "UpisPokrovitelja"("bpg");
CREATE INDEX IF NOT EXISTS "UpisPokrovitelja_pib_idx" ON "UpisPokrovitelja"("pib");
CREATE INDEX IF NOT EXISTS "UgovorDobra_upisId_status_idx" ON "UgovorDobra"("upisId", "status");
CREATE INDEX IF NOT EXISTS "DavalacZaposleni_upisId_opozvanAt_idx" ON "DavalacZaposleni"("upisId", "opozvanAt");
CREATE INDEX IF NOT EXISTS "ZabranaDavaoca_upisId_skinutoAt_idx" ON "ZabranaDavaoca"("upisId", "skinutoAt");

-- ─── Popuna iz zatečenih podataka ────────────────────────────────────────────
-- A) Novčani pokrovitelji (po PIB-u) → odobren upis. Podatke o zastupniku daje
--    najnovija prijava istog PIB-a (potvrđena ima prednost).
INSERT INTO "UpisPokrovitelja" (
  "id", "vrsta", "status", "vlasnikUserId", "naziv", "adresaSedista", "maticniBroj", "pib",
  "imePrezime", "zastupnikFunkcija", "kontaktEmail", "kontaktTelefon", "logoUrl",
  "aprProveraAt", "odlukaAt", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, 'FIRMA'::"VrstaDavaoca", 'ODOBREN'::"StatusUpisaPokrovitelja", p."vlasnikId",
  p."naziv", COALESCE(p."adresa", pp."adresaSedista"), COALESCE(p."maticniBroj", pp."maticniBroj"), p."pib",
  pp."zastupnikImePrezime", pp."zastupnikFunkcija", p."kontaktEmail", p."kontaktTelefon", p."logoUrl",
  pp."aprUporedjenAt", CURRENT_TIMESTAMP, p."createdAt", CURRENT_TIMESTAMP
FROM "Pokrovitelj" p
LEFT JOIN LATERAL (
  SELECT x."adresaSedista", x."maticniBroj", x."zastupnikImePrezime", x."zastupnikFunkcija", x."aprUporedjenAt"
  FROM "PokroviteljPrijava" x
  WHERE x."pib" = p."pib"
  ORDER BY (x."status" = 'POTVRDJENA') DESC, x."createdAt" DESC
  LIMIT 1
) pp ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM "UpisPokrovitelja" u WHERE u."pib" = p."pib");

-- B) Davaoci dobara i usluga — pravno lice i preduzetnik (po matičnom broju).
--    Odobren je onaj čija je prijava već prihvaćena (ugovor generisan, potpisan ili
--    raskinut); davalac samo sa prijavom na pregledu dobija upis na proveri.
INSERT INTO "UpisPokrovitelja" (
  "id", "vrsta", "status", "vlasnikUserId", "naziv", "adresaSedista", "maticniBroj", "pib",
  "imePrezime", "zastupnikFunkcija", "odnosPremaDavaocu", "kontaktEmail", "kontaktTelefon", "logoUrl",
  "izjavaOvlascenjaAt", "potvrdaEvidentiranjaAt", "potvrdaEvidentiranjaTekst", "aprProveraAt", "odlukaAt",
  "createdAt", "updatedAt"
)
SELECT DISTINCT ON (d."maticniBroj")
  gen_random_uuid()::text, 'FIRMA'::"VrstaDavaoca",
  CASE WHEN EXISTS (
    SELECT 1 FROM "UgovorDobra" y
    WHERE y."maticniBroj" = d."maticniBroj" AND y."status" IN ('CEKA_POTPIS', 'POTPISAN', 'RASKINUT')
  ) THEN 'ODOBREN'::"StatusUpisaPokrovitelja" ELSE 'NA_PROVERI'::"StatusUpisaPokrovitelja" END,
  d."podnosilacId", d."naziv", d."adresaSedista", d."maticniBroj", d."pib",
  d."zastupnikImePrezime", CASE WHEN d."odnosPremaDavaocu" = 'ZASTUPNIK' THEN d."zastupnikFunkcija" ELSE NULL END,
  d."odnosPremaDavaocu", d."kontaktEmail", d."kontaktTelefon", d."logoUrl",
  d."izjavaOvlascenjeAt", d."potvrdaEvidentiranjaAt", d."potvrdaEvidentiranjaTekst", d."aprUporedjenAt",
  d."pregledanoAt", d."createdAt", CURRENT_TIMESTAMP
FROM "UgovorDobra" d
WHERE d."vrstaDavaoca" = 'FIRMA' AND d."maticniBroj" IS NOT NULL AND d."status" <> 'ODBIJEN'
  AND NOT EXISTS (
    SELECT 1 FROM "UpisPokrovitelja" u
    WHERE u."maticniBroj" = d."maticniBroj" OR (d."pib" IS NOT NULL AND u."pib" = d."pib")
  )
ORDER BY d."maticniBroj", d."createdAt" DESC;

-- C) Davaoci dobara i usluga — nosilac registrovanog gazdinstva (po BPG-u).
INSERT INTO "UpisPokrovitelja" (
  "id", "vrsta", "status", "vlasnikUserId", "naziv", "bpg",
  "imePrezime", "odnosPremaDavaocu", "kontaktEmail", "kontaktTelefon", "logoUrl",
  "potvrdaEvidentiranjaAt", "potvrdaEvidentiranjaTekst", "odlukaAt", "createdAt", "updatedAt"
)
SELECT DISTINCT ON (d."bpg")
  gen_random_uuid()::text, 'GAZDINSTVO'::"VrstaDavaoca",
  CASE WHEN EXISTS (
    SELECT 1 FROM "UgovorDobra" y
    WHERE y."bpg" = d."bpg" AND y."status" IN ('CEKA_POTPIS', 'POTPISAN', 'RASKINUT')
  ) THEN 'ODOBREN'::"StatusUpisaPokrovitelja" ELSE 'NA_PROVERI'::"StatusUpisaPokrovitelja" END,
  d."podnosilacId", d."naziv", d."bpg",
  d."zastupnikImePrezime", 'NOSILAC_GAZDINSTVA'::"OdnosPremaDavaocu", d."kontaktEmail", d."kontaktTelefon", d."logoUrl",
  d."potvrdaEvidentiranjaAt", d."potvrdaEvidentiranjaTekst", d."pregledanoAt", d."createdAt", CURRENT_TIMESTAMP
FROM "UgovorDobra" d
WHERE d."vrstaDavaoca" = 'GAZDINSTVO' AND d."bpg" IS NOT NULL AND d."status" <> 'ODBIJEN'
  AND NOT EXISTS (SELECT 1 FROM "UpisPokrovitelja" u WHERE u."bpg" = d."bpg")
ORDER BY d."bpg", d."createdAt" DESC;

-- D) Novčane prijave u toku (čekaju potpis ili potvrdu) bez upisa → upis na
--    proveri: Fondacija ga odobrava uz poređenje sa registrom, pa potvrđuje prijem.
INSERT INTO "UpisPokrovitelja" (
  "id", "vrsta", "status", "vlasnikUserId", "naziv", "adresaSedista", "maticniBroj", "pib",
  "imePrezime", "zastupnikFunkcija", "logoUrl", "createdAt", "updatedAt"
)
SELECT DISTINCT ON (x."pib")
  gen_random_uuid()::text, 'FIRMA'::"VrstaDavaoca", 'NA_PROVERI'::"StatusUpisaPokrovitelja", x."podnosilacId",
  x."naziv", x."adresaSedista", x."maticniBroj", x."pib", x."zastupnikImePrezime", x."zastupnikFunkcija", x."logoUrl",
  x."createdAt", CURRENT_TIMESTAMP
FROM "PokroviteljPrijava" x
WHERE x."status" IN ('CEKA_POTPIS', 'POTPISANA')
  AND NOT EXISTS (
    SELECT 1 FROM "UpisPokrovitelja" u
    WHERE u."pib" = x."pib" OR (x."maticniBroj" IS NOT NULL AND u."maticniBroj" = x."maticniBroj")
  )
ORDER BY x."pib", x."createdAt" DESC;

-- E) Dvostruki živ upis istog MB, odnosno BPG-a (npr. dva PIB-a sa istim MB u
--    zatečenim podacima): ostaje najstariji, ostali se označavaju kao odbijeni, da
--    jedinstveni indeks ispod ne obori migraciju.
UPDATE "UpisPokrovitelja" u
SET "status" = 'ODBIJEN', "odbijenoRazlog" = 'Dvostruki upis istog pokrovitelja u zatečenim podacima.'
WHERE u."status" <> 'ODBIJEN' AND u."obrisanAt" IS NULL AND u."maticniBroj" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "UpisPokrovitelja" s
    WHERE s."maticniBroj" = u."maticniBroj" AND s."status" <> 'ODBIJEN' AND s."obrisanAt" IS NULL
      AND (s."createdAt" < u."createdAt" OR (s."createdAt" = u."createdAt" AND s."id" < u."id"))
  );
UPDATE "UpisPokrovitelja" u
SET "status" = 'ODBIJEN', "odbijenoRazlog" = 'Dvostruki upis istog pokrovitelja u zatečenim podacima.'
WHERE u."status" <> 'ODBIJEN' AND u."obrisanAt" IS NULL AND u."bpg" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "UpisPokrovitelja" s
    WHERE s."bpg" = u."bpg" AND s."status" <> 'ODBIJEN' AND s."obrisanAt" IS NULL
      AND (s."createdAt" < u."createdAt" OR (s."createdAt" = u."createdAt" AND s."id" < u."id"))
  );

-- ─── Veze ────────────────────────────────────────────────────────────────────
UPDATE "Pokrovitelj" p SET "upisId" = (
  SELECT u."id" FROM "UpisPokrovitelja" u
  WHERE u."vrsta" = 'FIRMA' AND u."pib" = p."pib"
  ORDER BY (u."status" = 'ODBIJEN'), u."createdAt" LIMIT 1
) WHERE p."upisId" IS NULL;

UPDATE "PokroviteljPrijava" x SET "upisId" = (
  SELECT u."id" FROM "UpisPokrovitelja" u
  WHERE u."vrsta" = 'FIRMA' AND u."pib" = x."pib"
  ORDER BY (u."status" = 'ODBIJEN'), u."createdAt" LIMIT 1
) WHERE x."upisId" IS NULL;

UPDATE "UgovorDobra" d SET "upisId" = (
  SELECT u."id" FROM "UpisPokrovitelja" u
  WHERE u."vrsta" = 'FIRMA'
    AND (u."maticniBroj" = d."maticniBroj" OR (u."maticniBroj" IS NULL AND d."pib" IS NOT NULL AND u."pib" = d."pib"))
  ORDER BY (d."pib" IS NOT NULL AND u."pib" = d."pib") DESC, (u."status" = 'ODBIJEN'), u."createdAt" LIMIT 1
) WHERE d."upisId" IS NULL AND d."vrstaDavaoca" = 'FIRMA';

UPDATE "UgovorDobra" d SET "upisId" = (
  SELECT u."id" FROM "UpisPokrovitelja" u
  WHERE u."vrsta" = 'GAZDINSTVO' AND u."bpg" = d."bpg"
  ORDER BY (u."status" = 'ODBIJEN'), u."createdAt" LIMIT 1
) WHERE d."upisId" IS NULL AND d."vrstaDavaoca" = 'GAZDINSTVO';

UPDATE "ZabranaDavaoca" z SET "upisId" = (
  SELECT u."id" FROM "UpisPokrovitelja" u
  WHERE (z."vrstaDavaoca" = 'FIRMA' AND u."vrsta" = 'FIRMA' AND u."maticniBroj" = z."maticniBroj")
     OR (z."vrstaDavaoca" = 'GAZDINSTVO' AND u."vrsta" = 'GAZDINSTVO' AND u."bpg" = z."bpg")
  ORDER BY (u."status" = 'ODBIJEN'), u."createdAt" LIMIT 1
) WHERE z."upisId" IS NULL;

-- Zaposleni se vezuju za upis (donacije čl. 13g st. 6). Ranije je ovlašćenje važilo
-- za sve ugovore podnosioca, pa se prenosi na SVAKI živ upis koji on vodi.
DROP INDEX IF EXISTS "DavalacZaposleni_aktivan_par_key";
UPDATE "DavalacZaposleni" z SET "upisId" = (
  SELECT u."id" FROM "UpisPokrovitelja" u
  WHERE u."vlasnikUserId" = z."davalacUserId" AND u."status" <> 'ODBIJEN'
  ORDER BY u."createdAt" LIMIT 1
) WHERE z."upisId" IS NULL;
INSERT INTO "DavalacZaposleni" ("id", "upisId", "davalacUserId", "zaposleniUserId", "dodatAt", "opozvanAt", "opozvanRazlog")
SELECT gen_random_uuid()::text, u."id", z."davalacUserId", z."zaposleniUserId", z."dodatAt", z."opozvanAt", z."opozvanRazlog"
FROM "DavalacZaposleni" z
JOIN "UpisPokrovitelja" u ON u."vlasnikUserId" = z."davalacUserId" AND u."status" <> 'ODBIJEN' AND u."id" <> z."upisId"
WHERE z."upisId" IS NOT NULL;

-- ─── Jedinstvenost i spoljni ključevi ────────────────────────────────────────
-- Najviše jedan živ upis po matičnom broju, odnosno BPG-u (čl. 6a st. 5). Odbijen
-- i obrisan upis ne zatvaraju nov. Delimičan indeks Prisma ne izražava u šemi.
CREATE UNIQUE INDEX IF NOT EXISTS "UpisPokrovitelja_ziv_mb_key" ON "UpisPokrovitelja"("maticniBroj")
  WHERE "obrisanAt" IS NULL AND "status" <> 'ODBIJEN' AND "maticniBroj" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "UpisPokrovitelja_ziv_bpg_key" ON "UpisPokrovitelja"("bpg")
  WHERE "obrisanAt" IS NULL AND "status" <> 'ODBIJEN' AND "bpg" IS NOT NULL;
-- Najviše jedno AKTIVNO ovlašćenje zaposlenog po upisu.
CREATE UNIQUE INDEX IF NOT EXISTS "DavalacZaposleni_aktivan_upis_key" ON "DavalacZaposleni"("upisId", "zaposleniUserId")
  WHERE "opozvanAt" IS NULL AND "upisId" IS NOT NULL;

ALTER TABLE "Pokrovitelj" ADD CONSTRAINT "Pokrovitelj_upisId_fkey" FOREIGN KEY ("upisId") REFERENCES "UpisPokrovitelja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PokroviteljPrijava" ADD CONSTRAINT "PokroviteljPrijava_upisId_fkey" FOREIGN KEY ("upisId") REFERENCES "UpisPokrovitelja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UgovorDobra" ADD CONSTRAINT "UgovorDobra_upisId_fkey" FOREIGN KEY ("upisId") REFERENCES "UpisPokrovitelja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DavalacZaposleni" ADD CONSTRAINT "DavalacZaposleni_upisId_fkey" FOREIGN KEY ("upisId") REFERENCES "UpisPokrovitelja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ZabranaDavaoca" ADD CONSTRAINT "ZabranaDavaoca_upisId_fkey" FOREIGN KEY ("upisId") REFERENCES "UpisPokrovitelja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UpisPokrovitelja" ADD CONSTRAINT "UpisPokrovitelja_vlasnikUserId_fkey" FOREIGN KEY ("vlasnikUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
