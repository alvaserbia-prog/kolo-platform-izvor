-- Osnivacki doprinos (Pravilnik o osnivackom doprinosu v3.7.0)
-- 120 koraka × 20.000 POEN = 2.400.000 POEN max

CREATE TABLE "OsnivackiKanal" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "ukupnoEvidentirano" INTEGER NOT NULL DEFAULT 0,
    "brojKoraka" INTEGER NOT NULL DEFAULT 0,
    "zatvoren" BOOLEAN NOT NULL DEFAULT false,
    "zatvorenAt" TIMESTAMP(3),
    "poslednjiPrag" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OsnivackiKanal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Osnivac" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "udeoBrojilac" INTEGER NOT NULL,
    "udeoImenilac" INTEGER NOT NULL,
    "redniBroj" INTEGER NOT NULL,
    "napomena" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Osnivac_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Osnivac_userId_key" ON "Osnivac"("userId");
CREATE UNIQUE INDEX "Osnivac_redniBroj_key" ON "Osnivac"("redniBroj");
ALTER TABLE "Osnivac" ADD CONSTRAINT "Osnivac_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OsnivackiKorakLog" (
    "id" TEXT NOT NULL,
    "brojKoraka" INTEGER NOT NULL,
    "prag" INTEGER NOT NULL,
    "ukupanPoenUSistemu" INTEGER NOT NULL,
    "iznosKoraka" INTEGER NOT NULL DEFAULT 20000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OsnivackiKorakLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OsnivackiKorakLog_brojKoraka_key" ON "OsnivackiKorakLog"("brojKoraka");

CREATE TABLE "OsnivackiKorakEmisija" (
    "id" TEXT NOT NULL,
    "korakLogId" TEXT NOT NULL,
    "osnivacId" TEXT NOT NULL,
    "iznosPoen" INTEGER NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OsnivackiKorakEmisija_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OsnivackiKorakEmisija_korakLogId_osnivacId_key" ON "OsnivackiKorakEmisija"("korakLogId", "osnivacId");
ALTER TABLE "OsnivackiKorakEmisija" ADD CONSTRAINT "OsnivackiKorakEmisija_korakLogId_fkey" FOREIGN KEY ("korakLogId") REFERENCES "OsnivackiKorakLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OsnivackiKorakEmisija" ADD CONSTRAINT "OsnivackiKorakEmisija_osnivacId_fkey" FOREIGN KEY ("osnivacId") REFERENCES "Osnivac"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Inicijalni singleton red
INSERT INTO "OsnivackiKanal" (id, "updatedAt") VALUES ('singleton', NOW());
