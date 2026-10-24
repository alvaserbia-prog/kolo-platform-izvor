-- Nadzor integriteta verifikacija (anti-malverzacija, 1. krug).
-- Tabela u koju noćni cron upisuje obeležene naloge/grupe (pravila P1–P15).
-- subjektId je plain TEXT (bez FK na User) — model je labavo spregnut.

-- CreateTable
CREATE TABLE "RizikNalaz" (
    "id" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "subjektId" TEXT,
    "pseudonim" TEXT,
    "clanovi" TEXT,
    "pravila" TEXT NOT NULL,
    "rizik" INTEGER NOT NULL,
    "nivo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OTVOREN',
    "resenById" TEXT,
    "resenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RizikNalaz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RizikNalaz_status_rizik_idx" ON "RizikNalaz"("status", "rizik" DESC);

-- CreateIndex
CREATE INDEX "RizikNalaz_subjektId_idx" ON "RizikNalaz"("subjektId");
