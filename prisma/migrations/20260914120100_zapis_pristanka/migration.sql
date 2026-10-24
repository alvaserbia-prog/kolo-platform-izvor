-- Dokaz pristanka i dokaz zaključenja ugovora (R-06, set 4.6.3).
--
-- Do ove migracije sistem nije imao nijedan zapis o prihvatanju Uslova i Politike:
-- kvačice pri registraciji živele su samo u pretraživaču. ZZPL čl. 15 st. 1 traži
-- da rukovalac bude u stanju da DOKAŽE pristanak.
--
-- 🔴 Bez IP adrese i podataka o uređaju — vidi komentar uz model u schema.prisma.

CREATE TABLE "ZapisPristanka" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vrsta" "VrstaPristanka" NOT NULL,
    "verzija" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "jezik" TEXT NOT NULL,
    "izvor" TEXT NOT NULL,
    "datAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "povucenAt" TIMESTAMP(3),

    CONSTRAINT "ZapisPristanka_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ZapisPristanka_userId_vrsta_verzija_key" ON "ZapisPristanka"("userId", "vrsta", "verzija");
CREATE INDEX "ZapisPristanka_userId_idx" ON "ZapisPristanka"("userId");
CREATE INDEX "ZapisPristanka_userId_vrsta_idx" ON "ZapisPristanka"("userId", "vrsta");

ALTER TABLE "ZapisPristanka" ADD CONSTRAINT "ZapisPristanka_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tekst izričitog pristanka za socijalni program (ZZPL čl. 17 st. 2 t. 1).
-- Zatečene prijave ostaju bez teksta: za njih nije ni snimljen, a retroaktivno
-- upisan tekst bio bi netačan dokument.
ALTER TABLE "ProgramEnrollment" ADD COLUMN "pristanakTekst" TEXT;
ALTER TABLE "ProgramEnrollment" ADD COLUMN "pristanakAt" TIMESTAMP(3);
ALTER TABLE "ProgramEnrollment" ADD COLUMN "pristanakJezik" TEXT;
ALTER TABLE "ProgramEnrollment" ADD COLUMN "pristanakPovucenAt" TIMESTAMP(3);

-- Saglasnost roditelja na obradu podataka deteta (ZZPL čl. 16), odvojeno od izjave
-- o postojanju deteta. Zatečene veze ostaju prazne — isto pravilo.
ALTER TABLE "Roditeljstvo" ADD COLUMN "saglasnostAt" TIMESTAMP(3);
ALTER TABLE "Roditeljstvo" ADD COLUMN "saglasnostTekst" TEXT;

-- Potvrda elektronske adrese (Uslovi čl. 9). Nije uslov za rad naloga.
-- Zatečeni nalozi ostaju nepotvrđeni — potvrda se nikad nije ni tražila.
ALTER TABLE "User" ADD COLUMN "emailPotvrdjenAt" TIMESTAMP(3);
