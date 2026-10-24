-- Migracija: preimenuje sve "Zadruga*" i "ZADRUGA*" u bazi u "Krug*" / "KRUG*"
-- Čuva sve postojeće podatke; isključivo rename operacije (nema DROP ili DATA promena).

-- ─── Enum vrednosti (values unutar postojećih enum tipova) ──────────────────
ALTER TYPE "Role" RENAME VALUE 'ZADRUGAR' TO 'CLAN_KRUGA';
ALTER TYPE "WalletType" RENAME VALUE 'ZADRUGA' TO 'KRUG';
ALTER TYPE "TransactionType" RENAME VALUE 'EMISIJA_ZADRUGA_OSNIVANJE' TO 'EMISIJA_KRUG_OSNIVANJE';
ALTER TYPE "TransactionType" RENAME VALUE 'EMISIJA_ZADRUGA_BONUS' TO 'EMISIJA_KRUG_BONUS';
ALTER TYPE "PokroviteljDoprinosTip" RENAME VALUE 'SPONZORSTVO_ZADRUGE' TO 'SPONZORSTVO_KRUGA';
ALTER TYPE "OglasSource" RENAME VALUE 'ZADRUGA' TO 'KRUG';

-- ─── Enum tipovi (sami nazivi) ───────────────────────────────────────────────
ALTER TYPE "ZadrugaStatus" RENAME TO "KrugStatus";
ALTER TYPE "ZadrugaOsnivanjeStatus" RENAME TO "KrugOsnivanjeStatus";

-- ─── Tabele ──────────────────────────────────────────────────────────────────
ALTER TABLE "Zadruga" RENAME TO "Krug";
ALTER TABLE "ZadrugaMembership" RENAME TO "KrugClanstvo";
ALTER TABLE "ZadrugaOsnivanjeZahtev" RENAME TO "KrugOsnivanjeZahtev";
ALTER TABLE "ZadrugaPristupnica" RENAME TO "KrugPristupnica";
ALTER TABLE "ZadrugaProject" RENAME TO "KrugProjekat";
ALTER TABLE "ZadrugaBonusLog" RENAME TO "KrugBonusLog";

-- ─── Kolone (zadrugaId → krugId) ─────────────────────────────────────────────
ALTER TABLE "Wallet" RENAME COLUMN "zadrugaId" TO "krugId";
ALTER TABLE "KrugClanstvo" RENAME COLUMN "zadrugaId" TO "krugId";
ALTER TABLE "KrugPristupnica" RENAME COLUMN "zadrugaId" TO "krugId";
ALTER TABLE "KrugProjekat" RENAME COLUMN "zadrugaId" TO "krugId";
ALTER TABLE "KrugBonusLog" RENAME COLUMN "zadrugaId" TO "krugId";
-- Napomena: tabele RadniOglas i Pokrovitelj u bazi i dalje imaju "zadrugaId" kolonu.
-- Te kolone su existing drift (schema ih je obrisala kao RadniOglas → DoprinosOglas,
-- a Pokrovitelj više nema zadrugaId polje). Posle RENAME "Zadruga" → "Krug", FK-ovi tih
-- kolona automatski prate rename (i dalje referiraju ispravan PK). Drift se rešava u
-- zasebnoj migraciji koja će uskladiti RadniOglas/Pokrovitelj sa trenutnom schemom.

-- ─── Primary key constraints ─────────────────────────────────────────────────
ALTER TABLE "Krug"                RENAME CONSTRAINT "Zadruga_pkey"                TO "Krug_pkey";
ALTER TABLE "KrugClanstvo"        RENAME CONSTRAINT "ZadrugaMembership_pkey"      TO "KrugClanstvo_pkey";
ALTER TABLE "KrugOsnivanjeZahtev" RENAME CONSTRAINT "ZadrugaOsnivanjeZahtev_pkey" TO "KrugOsnivanjeZahtev_pkey";
ALTER TABLE "KrugPristupnica"     RENAME CONSTRAINT "ZadrugaPristupnica_pkey"     TO "KrugPristupnica_pkey";
ALTER TABLE "KrugProjekat"        RENAME CONSTRAINT "ZadrugaProject_pkey"         TO "KrugProjekat_pkey";
ALTER TABLE "KrugBonusLog"        RENAME CONSTRAINT "ZadrugaBonusLog_pkey"        TO "KrugBonusLog_pkey";

-- ─── Foreign key constraints ─────────────────────────────────────────────────
ALTER TABLE "Wallet"              RENAME CONSTRAINT "Wallet_zadrugaId_fkey"                 TO "Wallet_krugId_fkey";
ALTER TABLE "KrugClanstvo"        RENAME CONSTRAINT "ZadrugaMembership_userId_fkey"         TO "KrugClanstvo_userId_fkey";
ALTER TABLE "KrugClanstvo"        RENAME CONSTRAINT "ZadrugaMembership_zadrugaId_fkey"      TO "KrugClanstvo_krugId_fkey";
ALTER TABLE "KrugOsnivanjeZahtev" RENAME CONSTRAINT "ZadrugaOsnivanjeZahtev_inicijatorId_fkey" TO "KrugOsnivanjeZahtev_inicijatorId_fkey";
ALTER TABLE "KrugPristupnica"     RENAME CONSTRAINT "ZadrugaPristupnica_userId_fkey"        TO "KrugPristupnica_userId_fkey";
ALTER TABLE "KrugPristupnica"     RENAME CONSTRAINT "ZadrugaPristupnica_zadrugaId_fkey"     TO "KrugPristupnica_krugId_fkey";
ALTER TABLE "KrugProjekat"        RENAME CONSTRAINT "ZadrugaProject_zadrugaId_fkey"         TO "KrugProjekat_krugId_fkey";
ALTER TABLE "KrugBonusLog"        RENAME CONSTRAINT "ZadrugaBonusLog_zadrugaId_fkey"        TO "KrugBonusLog_krugId_fkey";

-- ─── Indeksi (unique + regular) ──────────────────────────────────────────────
ALTER INDEX "Wallet_zadrugaId_key"                  RENAME TO "Wallet_krugId_key";
ALTER INDEX "Zadruga_name_key"                      RENAME TO "Krug_name_key";
ALTER INDEX "ZadrugaMembership_userId_leftAt_idx"   RENAME TO "KrugClanstvo_userId_leftAt_idx";
ALTER INDEX "ZadrugaMembership_zadrugaId_leftAt_idx" RENAME TO "KrugClanstvo_krugId_leftAt_idx";
ALTER INDEX "ZadrugaPristupnica_userId_zadrugaId_key" RENAME TO "KrugPristupnica_userId_krugId_key";

-- ─── Drugi nasleđeni drift-ovi (banka→protokol, ZAPOSLJAVNJE→PED, RadniOglas→DoprinosOglas) ──

-- Enum vrednosti
ALTER TYPE "WalletType" RENAME VALUE 'BANKA' TO 'PROTOKOL';
ALTER TYPE "ProgramType" RENAME VALUE 'ZAPOSLJAVNJE' TO 'PED';

-- Enum tip (rename samog tipa)
ALTER TYPE "RadnaPrijavaStatus" RENAME TO "OglasPrijavaStatus";

-- Tabele (programski deo)
ALTER TABLE "BankaProgram" RENAME TO "ProtokolProgram";
ALTER TABLE "ZaposljvanjeEvidencija" RENAME TO "DoprinosEvidencija";

-- Tabele (oglas deo)
ALTER TABLE "RadniOglas" RENAME TO "DoprinosOglas";
ALTER TABLE "RadniOglasPrijava" RENAME TO "OglasPrijava";
ALTER TABLE "RadnaEvidencija" RENAME TO "OglasEvidencija";

-- Kolone (zadrugaId → krugId u DoprinosOglas i Pokrovitelj)
ALTER TABLE "DoprinosOglas" RENAME COLUMN "zadrugaId" TO "krugId";
ALTER TABLE "Pokrovitelj" RENAME COLUMN "zadrugaId" TO "krugId";

-- PK constraints
ALTER TABLE "ProtokolProgram"      RENAME CONSTRAINT "BankaProgram_pkey"           TO "ProtokolProgram_pkey";
ALTER TABLE "DoprinosEvidencija"   RENAME CONSTRAINT "ZaposljvanjeEvidencija_pkey" TO "DoprinosEvidencija_pkey";
ALTER TABLE "DoprinosOglas"        RENAME CONSTRAINT "RadniOglas_pkey"             TO "DoprinosOglas_pkey";
ALTER TABLE "OglasPrijava"         RENAME CONSTRAINT "RadniOglasPrijava_pkey"      TO "OglasPrijava_pkey";
ALTER TABLE "OglasEvidencija"      RENAME CONSTRAINT "RadnaEvidencija_pkey"        TO "OglasEvidencija_pkey";

-- FK constraints
ALTER TABLE "DoprinosEvidencija"   RENAME CONSTRAINT "ZaposljvanjeEvidencija_userId_fkey"        TO "DoprinosEvidencija_userId_fkey";
ALTER TABLE "DoprinosEvidencija"   RENAME CONSTRAINT "ZaposljvanjeEvidencija_enrollmentId_fkey"  TO "DoprinosEvidencija_enrollmentId_fkey";
ALTER TABLE "DoprinosOglas"        RENAME CONSTRAINT "RadniOglas_createdById_fkey"               TO "DoprinosOglas_createdById_fkey";
ALTER TABLE "DoprinosOglas"        RENAME CONSTRAINT "RadniOglas_zadrugaId_fkey"                 TO "DoprinosOglas_krugId_fkey";
ALTER TABLE "OglasPrijava"         RENAME CONSTRAINT "RadniOglasPrijava_oglasId_fkey"            TO "OglasPrijava_oglasId_fkey";
ALTER TABLE "OglasPrijava"         RENAME CONSTRAINT "RadniOglasPrijava_userId_fkey"             TO "OglasPrijava_userId_fkey";
ALTER TABLE "OglasEvidencija"      RENAME CONSTRAINT "RadnaEvidencija_userId_fkey"               TO "OglasEvidencija_userId_fkey";
ALTER TABLE "OglasEvidencija"      RENAME CONSTRAINT "RadnaEvidencija_oglasId_fkey"              TO "OglasEvidencija_oglasId_fkey";
ALTER TABLE "OglasEvidencija"      RENAME CONSTRAINT "RadnaEvidencija_prijavaId_fkey"            TO "OglasEvidencija_prijavaId_fkey";
ALTER TABLE "Pokrovitelj"          RENAME CONSTRAINT "Pokrovitelj_zadrugaId_fkey"                TO "Pokrovitelj_krugId_fkey";

-- Pokrovitelj.krugId više ne postoji u modelu — uklanjamo kolonu i FK
ALTER TABLE "Pokrovitelj" DROP CONSTRAINT IF EXISTS "Pokrovitelj_krugId_fkey";
ALTER TABLE "Pokrovitelj" DROP COLUMN IF EXISTS "krugId";

-- Indexes
ALTER INDEX "ZaposljvanjeEvidencija_date_status_idx"  RENAME TO "DoprinosEvidencija_date_status_idx";
ALTER INDEX "ZaposljvanjeEvidencija_userId_date_key"  RENAME TO "DoprinosEvidencija_userId_date_key";
ALTER INDEX "RadniOglas_status_createdAt_idx"         RENAME TO "DoprinosOglas_status_createdAt_idx";
ALTER INDEX "RadniOglasPrijava_oglasId_userId_key"    RENAME TO "OglasPrijava_oglasId_userId_key";
ALTER INDEX "RadniOglasPrijava_status_oglasId_idx"    RENAME TO "OglasPrijava_status_oglasId_idx";
ALTER INDEX "RadnaEvidencija_userId_oglasId_date_key" RENAME TO "OglasEvidencija_userId_oglasId_date_key";
ALTER INDEX "RadnaEvidencija_date_status_idx"         RENAME TO "OglasEvidencija_date_status_idx";
