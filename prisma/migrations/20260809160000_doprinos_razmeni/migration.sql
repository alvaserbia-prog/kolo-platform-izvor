-- Doprinos razmeni — putanja prvog kruga (Pravilnik o KOLO sistemu čl. 40a).
--
-- Lestvica od pet koraka × 1.000 POEN, doživotna kapa 5.000 POEN po korisniku:
--   1. prvi oglas sa sadržinskim minimumom + prva razmena u kojoj ti neko
--      evidentira POEN u korist            → ZATEČENI kanal, tabela "DoprinosSadrzaju"
--   2. prva razmena u kojoj TI evidentiraš POEN korisniku van svog lanca
--   3. tri oglasa, od kojih su dva dobila upit od RAZLIČITIH korisnika
--   4. razmene sa 5 različitih osoba van tvog lanca
--   5. razmene sa 10 različitih osoba van tvog lanca
--
-- Koraci se otključavaju REDOM. Korak 1 se ovom izmenom NE dira — iznos i
-- odloženo evidentiranje iz čl. 40a ostaju netaknuti, pa ova tabela nosi samo
-- korake 2–5 (najviše četiri reda po korisniku; kapu time drži baza, ne kod).

-- 1. Nov tip transakcije za korake 2–5. Zaseban od EMISIJA_SADRZAJ da bi se u
--    istoriji i u agregatima videlo šta je došlo sa lestvice, a šta iz čl. 40a.
ALTER TYPE "TransactionType" ADD VALUE 'EMISIJA_RAZMENA';

-- 2. Razmena povodom oglasa, sa OBOSTRANOM potvrdom.
--    U brojač ulazi samo REALIZOVANA — jednostrana tvrdnja ne vredi ništa, inače
--    bi lestvica bila samoposluživanje.
CREATE TYPE "RazmenaStatus" AS ENUM ('PREDLOZENA', 'REALIZOVANA', 'ODBIJENA');

CREATE TABLE "Razmena" (
    "id" TEXT NOT NULL,
    "oglasId" TEXT NOT NULL,
    "oglasivacId" TEXT NOT NULL,
    "sagovornikId" TEXT NOT NULL,
    "potvrdioOglasivacAt" TIMESTAMP(3),
    "potvrdioSagovornikAt" TIMESTAMP(3),
    "odbioId" TEXT,
    "status" "RazmenaStatus" NOT NULL DEFAULT 'PREDLOZENA',
    "realizovanoAt" TIMESTAMP(3),
    -- „Van lanca" se utvrđuje U TRENUTKU realizacije i TRAJNO pamti: kasniji rast
    -- lanca jemstva ne poništava već izbrojane sagovornike. Zato je kolona, a ne
    -- izvedena vrednost iz keša "verification_zone".
    "vanLanca" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Razmena_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Razmena_oglasId_sagovornikId_key" ON "Razmena"("oglasId", "sagovornikId");
CREATE INDEX "Razmena_oglasivacId_status_idx" ON "Razmena"("oglasivacId", "status");
CREATE INDEX "Razmena_sagovornikId_status_idx" ON "Razmena"("sagovornikId", "status");

ALTER TABLE "Razmena"
  ADD CONSTRAINT "Razmena_oglasId_fkey"
  FOREIGN KEY ("oglasId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Razmena"
  ADD CONSTRAINT "Razmena_oglasivacId_fkey"
  FOREIGN KEY ("oglasivacId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Razmena"
  ADD CONSTRAINT "Razmena_sagovornikId_fkey"
  FOREIGN KEY ("sagovornikId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Upit povodom oglasa (korak 3). Ne čuva sadržaj poruke — za brojač je
--    merodavno samo KO se javio i POVODOM ČEGA. Jedan red po paru, pa ponovljeno
--    javljanje istom oglasu ne umnožava brojač.
CREATE TABLE "OglasUpit" (
    "id" TEXT NOT NULL,
    "oglasId" TEXT NOT NULL,
    "posiljacId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OglasUpit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OglasUpit_oglasId_posiljacId_key" ON "OglasUpit"("oglasId", "posiljacId");
CREATE INDEX "OglasUpit_posiljacId_idx" ON "OglasUpit"("posiljacId");

ALTER TABLE "OglasUpit"
  ADD CONSTRAINT "OglasUpit_oglasId_fkey"
  FOREIGN KEY ("oglasId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OglasUpit"
  ADD CONSTRAINT "OglasUpit_posiljacId_fkey"
  FOREIGN KEY ("posiljacId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Koraci 2–5. Isti trojni status kao kod čl. 40a (ZABELEZEN → EVIDENTIRAN),
--    jer važi isto pravilo: nalogu čija stvarnost nije potvrđena doprinos se
--    beleži, a zapis POEN-a nastaje tek po verifikaciji.
CREATE TABLE "DoprinosRazmeni" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "korak" INTEGER NOT NULL,
    "iznos" INTEGER NOT NULL DEFAULT 1000,
    "status" "DoprinosStatus" NOT NULL DEFAULT 'ZABELEZEN',
    "transakcijaId" TEXT,
    "zabelezenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidentiranAt" TIMESTAMP(3),
    "obavestenAt" TIMESTAMP(3),

    CONSTRAINT "DoprinosRazmeni_pkey" PRIMARY KEY ("id")
);

-- Kapu drži BAZA: jedan red po (korisnik, korak) uz dozvoljen opseg 2–5 znači da
-- korisnik ne može imati više od četiri reda, pa ni više od 4.000 POEN-a odavde.
CREATE UNIQUE INDEX "DoprinosRazmeni_userId_korak_key" ON "DoprinosRazmeni"("userId", "korak");
CREATE INDEX "DoprinosRazmeni_status_idx" ON "DoprinosRazmeni"("status");

ALTER TABLE "DoprinosRazmeni"
  ADD CONSTRAINT "DoprinosRazmeni_korak_opseg" CHECK ("korak" BETWEEN 2 AND 5);

ALTER TABLE "DoprinosRazmeni"
  ADD CONSTRAINT "DoprinosRazmeni_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
