-- Set 5.0, paket P4: Pravilnik o operativnom doprinosu 5.0 i Pravilnik o zadrugama 5.0.

-- Zadruge čl. 22 st. 2 — zamrzavanje zapisa zadruge od otkaza ugovora, odnosno
-- pokretanja brisanja iz registra.
ALTER TABLE "Krug" ADD COLUMN "zamrznutoAt" TIMESTAMP(3);
ALTER TABLE "Krug" ADD COLUMN "zamrznutoOsnov" TEXT;

-- Operativni čl. 5, 8, 9, 12, 18, 23 — elementi zadatka koji su nedostajali.
ALTER TABLE "DoprinosOglas" ADD COLUMN "rokIzvrsenja" TIMESTAMP(3);
ALTER TABLE "DoprinosOglas" ADD COLUMN "kvalifikacioniUslov" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "kvalifikacioniObrazlozenje" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "odobravanjeObrazlozenje" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "povucenoAt" TIMESTAMP(3);
ALTER TABLE "DoprinosOglas" ADD COLUMN "povucenoObrazlozenje" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "obustavljenoAt" TIMESTAMP(3);
ALTER TABLE "DoprinosOglas" ADD COLUMN "obustavaObrazlozenje" TEXT;
ALTER TABLE "DoprinosOglas" ADD COLUMN "zadruzni" BOOLEAN NOT NULL DEFAULT false;

-- Završna odluka (čl. 16 st. 2).
CREATE TYPE "ZavrsnaOdluka" AS ENUM ('IZVRSEN', 'DELIMICNO', 'ODBIJEN');

-- Prijava: izmenjena prijava posle odbijanja (čl. 12 st. 4) i odustanak (čl. 17) traže
-- da par (zadatak, podnosilac) više ne bude jedinstven; jedinstvena je samo ŽIVA prijava.
DROP INDEX IF EXISTS "OglasPrijava_oglasId_userId_key";
CREATE INDEX "OglasPrijava_oglasId_userId_idx" ON "OglasPrijava"("oglasId", "userId");
ALTER TABLE "OglasPrijava" ADD COLUMN "aktivanKljuc" TEXT;
ALTER TABLE "OglasPrijava" ADD COLUMN "ispunjenostUslova" TEXT;
ALTER TABLE "OglasPrijava" ADD COLUMN "odustaoAt" TIMESTAMP(3);
ALTER TABLE "OglasPrijava" ADD COLUMN "zavrsetakAt" TIMESTAMP(3);
ALTER TABLE "OglasPrijava" ADD COLUMN "zavrsnaOdluka" "ZavrsnaOdluka";
ALTER TABLE "OglasPrijava" ADD COLUMN "zavrsnaOdlukaAt" TIMESTAMP(3);
ALTER TABLE "OglasPrijava" ADD COLUMN "zavrsnaOdlukaById" TEXT;
ALTER TABLE "OglasPrijava" ADD COLUMN "zavrsnoObrazlozenje" TEXT;
ALTER TABLE "OglasPrijava" ADD COLUMN "dodelioId" TEXT;
-- Tehnički ključ jedinstvenosti, ne snimljen tekst: dosadašnja jedinstvenost para se
-- prenosi na žive prijave (na čekanju ili primljene).
UPDATE "OglasPrijava" SET "aktivanKljuc" = "oglasId" || ':' || "userId" WHERE "status" IN ('PENDING', 'APPROVED');
CREATE UNIQUE INDEX "OglasPrijava_aktivanKljuc_key" ON "OglasPrijava"("aktivanKljuc");

-- Izvršenje celina: obrazloženje odluke, dopuna dokaza, red završne potvrde, višak zadruge.
ALTER TABLE "OglasEvidencija" ADD COLUMN "odlukaObrazlozenje" TEXT;
ALTER TABLE "OglasEvidencija" ADD COLUMN "dopunaAt" TIMESTAMP(3);
ALTER TABLE "OglasEvidencija" ADD COLUMN "zavrsna" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OglasEvidencija" ADD COLUMN "visakZadruge" INTEGER;
DROP INDEX IF EXISTS "OglasEvidencija_userId_oglasId_date_key";
CREATE UNIQUE INDEX "OglasEvidencija_userId_oglasId_date_zavrsna_key" ON "OglasEvidencija"("userId", "oglasId", "date", "zavrsna");

-- Primedba učesnika (čl. 18).
CREATE TABLE "OperativnaPrimedba" (
    "id" TEXT NOT NULL,
    "oglasId" TEXT NOT NULL,
    "prijavaId" TEXT,
    "evidencijaId" TEXT,
    "predmet" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "odluka" TEXT,
    "odlukaAt" TIMESTAMP(3),
    "odlukaById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperativnaPrimedba_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OperativnaPrimedba_oglasId_createdAt_idx" ON "OperativnaPrimedba"("oglasId", "createdAt");
ALTER TABLE "OperativnaPrimedba" ADD CONSTRAINT "OperativnaPrimedba_oglasId_fkey" FOREIGN KEY ("oglasId") REFERENCES "DoprinosOglas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperativnaPrimedba" ADD CONSTRAINT "OperativnaPrimedba_prijavaId_fkey" FOREIGN KEY ("prijavaId") REFERENCES "OglasPrijava"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperativnaPrimedba" ADD CONSTRAINT "OperativnaPrimedba_evidencijaId_fkey" FOREIGN KEY ("evidencijaId") REFERENCES "OglasEvidencija"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lice koje UO ovlasti da potvrđuje izvršenje (čl. 13 st. 1, 4).
CREATE TABLE "OperativnoOvlascenje" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "odluka" TEXT NOT NULL,
    "izuzetakPredlagaca" BOOLEAN NOT NULL DEFAULT false,
    "upisaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opozvanoAt" TIMESTAMP(3),
    CONSTRAINT "OperativnoOvlascenje_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OperativnoOvlascenje_userId_key" ON "OperativnoOvlascenje"("userId");

-- Parametri koje UO utvrđuje odlukom (iznos jedinice zadružnog doprinosa, prag za
-- režim odobravanja). Bez podrazumevane vrednosti: tabela počinje prazna.
CREATE TABLE "OdlukaParametra" (
    "id" TEXT NOT NULL,
    "kljuc" TEXT NOT NULL,
    "vrednost" INTEGER NOT NULL,
    "vaziOd" DATE NOT NULL,
    "odluka" TEXT NOT NULL,
    "upisaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OdlukaParametra_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OdlukaParametra_kljuc_vaziOd_idx" ON "OdlukaParametra"("kljuc", "vaziOd");
