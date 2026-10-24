-- R-04 (ZRNO kao investicioni instrument): iz baze se uklanjaju imena koja
-- protivreče Pravilniku o KOLO sistemu. Isključivo RENAME — nijedan red se ne
-- menja, ne briše i ne dodaje.
--
-- 🔴 Zašto uopšte: repo je javan pod AGPL-om, pa je `schema.prisma` prvi fajl
-- koji spoljni analitičar otvori. Akt je govorio jedno, a šema drugo:
--   • čl. 22 st. 3: „Za ZRNO ne postoji tržište"  ↔  model `ZrnoTrziste`
--   • čl. 23 st. 4: „nije cena, nije kurs"        ↔  `ZrnoDailyRate.kurs`
--   • čl. 19 st. 6: doprinos se „umanjuje"        ↔  `zrnaKupljeno`/`poenPlaceno`
--   • čl. 21 st. 2: Protokol „evidentira POEN-e"  ↔  `poenDobijeno`
-- Ne vraćati nijedno od starih imena.
--
-- 🟢 Dnevni snimak koeficijenta se NE briše — on je dokaz da koeficijent
-- izračunava Protokol automatski i bez diskrecije (čl. 23 st. 2). Menja se ime.

-- ─── Tabele ──────────────────────────────────────────────────────────────────
ALTER TABLE "ZrnoTrziste"   RENAME TO "ZrnoKanal";
ALTER TABLE "ZrnoDailyRate" RENAME TO "ZrnoDnevniKoeficijent";

-- ─── Kolone ──────────────────────────────────────────────────────────────────
ALTER TABLE "ZrnoDnevniKoeficijent" RENAME COLUMN "kurs"         TO "koeficijent";
ALTER TABLE "ZrnoUpisZahtev"        RENAME COLUMN "zrnaKupljeno" TO "zrnaUpisana";
ALTER TABLE "ZrnoUpisZahtev"        RENAME COLUMN "poenPlaceno"  TO "utrosenoPoen";
ALTER TABLE "ZrnoOtpisZahtev"       RENAME COLUMN "poenDobijeno" TO "evidentiranoPoen";

-- ─── Ograničenja i indeksi ───────────────────────────────────────────────────
-- Postgres pri RENAME TABLE zadržava stara imena ograničenja; preimenuju se da
-- se šema i baza ne raziđu pri narednom `prisma migrate dev`.
ALTER TABLE "ZrnoKanal" RENAME CONSTRAINT "ZrnoTrziste_pkey" TO "ZrnoKanal_pkey";
ALTER INDEX "ZrnoDailyRate_date_key" RENAME TO "ZrnoDnevniKoeficijent_date_key";
