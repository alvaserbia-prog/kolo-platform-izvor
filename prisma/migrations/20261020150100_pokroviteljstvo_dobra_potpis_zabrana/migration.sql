-- Pokroviteljstvo dobrima i uslugama — dopuna seta 4.7.8 (odluke vlasnika 20.10.2026):
--  * prijava: odnos podnosioca prema davaocu, kontakt mejl i telefon, izjava o
--    ovlašćenju i potvrda o načinu evidentiranja (trenutak + snimak teksta),
--    donacije čl. 13e;
--  * potpis na platformi uz jednokratni kod na mejl (čuva se samo heš, uz rok i broj
--    pokušaja) i kontrolni broj teksta, donacije čl. 13g st. 4. Bez IP adrese i
--    podataka o uređaju;
--  * vaučer: izjava o nepovezanosti i pristanak na prikaz (trenutak + snimak
--    teksta), nabavke čl. 30f;
--  * lista zabrane umesto zabrane od 12 meseci, donacije čl. 13j st. 2.
-- Ništa se ne briše: napuštene kolone i tabele (krugovi raspodele, izvori cene,
-- nedeljni kapacitet) ostaju zbog zatečenih redova.

-- AlterTable
ALTER TABLE "UgovorDobra" ADD COLUMN "odnosPremaDavaocu" "OdnosPremaDavaocu";
ALTER TABLE "UgovorDobra" ADD COLUMN "kontaktEmail" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN "kontaktTelefon" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN "izjavaOvlascenjeAt" TIMESTAMP(3);
ALTER TABLE "UgovorDobra" ADD COLUMN "potvrdaEvidentiranjaAt" TIMESTAMP(3);
ALTER TABLE "UgovorDobra" ADD COLUMN "potvrdaEvidentiranjaTekst" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN "kontrolniBroj" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN "potpisKodHash" TEXT;
ALTER TABLE "UgovorDobra" ADD COLUMN "potpisKodIstice" TIMESTAMP(3);
ALTER TABLE "UgovorDobra" ADD COLUMN "potpisKodPokusaja" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UgovorDobra" ADD COLUMN "potpisKodPoslatAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vaucer" ADD COLUMN "izjavaNepovezanAt" TIMESTAMP(3);
ALTER TABLE "Vaucer" ADD COLUMN "pristanakPrikazAt" TIMESTAMP(3);
ALTER TABLE "Vaucer" ADD COLUMN "pristanakPrikazTekst" TEXT;

-- CreateTable
CREATE TABLE "ZabranaDavaoca" (
    "id" TEXT NOT NULL,
    "vrstaDavaoca" "VrstaDavaoca" NOT NULL,
    "maticniBroj" TEXT,
    "bpg" TEXT,
    "naziv" TEXT NOT NULL,
    "ugovorId" TEXT,
    "razlog" TEXT NOT NULL,
    "upisaoId" TEXT,
    "upisanoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skinutoAt" TIMESTAMP(3),
    "skinuoId" TEXT,
    "skidanjeRazlog" TEXT,

    CONSTRAINT "ZabranaDavaoca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZabranaDavaoca_maticniBroj_skinutoAt_idx" ON "ZabranaDavaoca"("maticniBroj", "skinutoAt");

-- CreateIndex
CREATE INDEX "ZabranaDavaoca_bpg_skinutoAt_idx" ON "ZabranaDavaoca"("bpg", "skinutoAt");

-- Firma se prepoznaje po matičnom broju, gazdinstvo po BPG.
ALTER TABLE "ZabranaDavaoca" ADD CONSTRAINT "ZabranaDavaoca_davalac_identifikator" CHECK (
  ("vrstaDavaoca" = 'FIRMA' AND "maticniBroj" IS NOT NULL)
  OR ("vrstaDavaoca" = 'GAZDINSTVO' AND "bpg" IS NOT NULL)
);

-- AddForeignKey
ALTER TABLE "ZabranaDavaoca" ADD CONSTRAINT "ZabranaDavaoca_ugovorId_fkey" FOREIGN KEY ("ugovorId") REFERENCES "UgovorDobra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Zatečeni raskinuti ugovori: davalac ide na listu zabrane (ranije pravilo od 12
-- meseci zamenjeno je zabranom do odluke Fondacije, čl. 13j st. 2).
INSERT INTO "ZabranaDavaoca" ("id", "vrstaDavaoca", "maticniBroj", "bpg", "naziv", "ugovorId", "razlog", "upisaoId", "upisanoAt")
SELECT gen_random_uuid()::text, u."vrstaDavaoca", u."maticniBroj", u."bpg", u."naziv", u."id",
       COALESCE(u."raskidObrazlozenje", 'Raskid ugovora po neizvršenju'), u."raskinuoId", COALESCE(u."raskinutoAt", CURRENT_TIMESTAMP)
FROM "UgovorDobra" u
WHERE u."status" = 'RASKINUT'
  AND ((u."vrstaDavaoca" = 'FIRMA' AND u."maticniBroj" IS NOT NULL) OR (u."vrstaDavaoca" = 'GAZDINSTVO' AND u."bpg" IS NOT NULL));

-- Broj POEN-a po vaučeru (nabavke čl. 30d) snima se od sada pri potpisu. Zatečeni
-- potpisani ugovori bez snimka dobijaju ga po istom pravilu (vrednost × 1,00 ÷ broj
-- vaučera, zaokruženo kao Math.round), da bi vaučeri bili odmah dostupni.
UPDATE "UgovorDobra"
SET "poenaPoVauceru" = ROUND("vrednostRsd" / "brojVaucera")::INTEGER
WHERE "status" = 'POTPISAN' AND "poenaPoVauceru" IS NULL AND "brojVaucera" > 0;
