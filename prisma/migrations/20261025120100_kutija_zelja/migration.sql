-- Kutija želja u dečjem prostoru (whitepaper 5.0, pogl. 7; odluka vlasnika 25.10.2026).
-- Predlozi dece, podrške i odgovori Fondacije. Enum StanjeZelje je u ..._kutija_zelja_enum.

-- CreateTable
CREATE TABLE "ZeljaDeteta" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "stanje" "StanjeZelje" NOT NULL DEFAULT 'NA_PREGLEDU',
    "pregledaoId" TEXT,
    "pregledanoAt" TIMESTAMP(3),
    "razlogOdbijanja" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZeljaDeteta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodrskaZelje" (
    "id" TEXT NOT NULL,
    "zeljaId" TEXT NOT NULL,
    "deteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PodrskaZelje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdgovorNaZelju" (
    "id" TEXT NOT NULL,
    "zeljaId" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "odgovorioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdgovorNaZelju_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZeljaDeteta_autorId_idx" ON "ZeljaDeteta"("autorId");

-- CreateIndex
CREATE INDEX "ZeljaDeteta_stanje_idx" ON "ZeljaDeteta"("stanje");

-- CreateIndex
CREATE INDEX "PodrskaZelje_deteId_idx" ON "PodrskaZelje"("deteId");

-- CreateIndex
CREATE UNIQUE INDEX "PodrskaZelje_zeljaId_deteId_key" ON "PodrskaZelje"("zeljaId", "deteId");

-- CreateIndex
CREATE UNIQUE INDEX "OdgovorNaZelju_zeljaId_key" ON "OdgovorNaZelju"("zeljaId");

-- AddForeignKey
ALTER TABLE "ZeljaDeteta" ADD CONSTRAINT "ZeljaDeteta_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZeljaDeteta" ADD CONSTRAINT "ZeljaDeteta_pregledaoId_fkey" FOREIGN KEY ("pregledaoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodrskaZelje" ADD CONSTRAINT "PodrskaZelje_zeljaId_fkey" FOREIGN KEY ("zeljaId") REFERENCES "ZeljaDeteta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodrskaZelje" ADD CONSTRAINT "PodrskaZelje_deteId_fkey" FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdgovorNaZelju" ADD CONSTRAINT "OdgovorNaZelju_zeljaId_fkey" FOREIGN KEY ("zeljaId") REFERENCES "ZeljaDeteta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdgovorNaZelju" ADD CONSTRAINT "OdgovorNaZelju_odgovorioId_fkey" FOREIGN KEY ("odgovorioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

