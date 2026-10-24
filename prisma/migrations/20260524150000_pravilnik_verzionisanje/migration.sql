-- Verzionisanje Pravilnika (paralelo sa Politikom, v3.7.0)

CREATE TABLE "PravilnikVerzija" (
    "id" TEXT NOT NULL,
    "verzija" TEXT NOT NULL,
    "naslov" TEXT NOT NULL,
    "efektivnaOd" TIMESTAMP(3) NOT NULL,
    "kreirao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PravilnikVerzija_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PravilnikVerzija_verzija_key" ON "PravilnikVerzija"("verzija");

CREATE TABLE "PravilnikPrihvatanje" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verzijaId" TEXT NOT NULL,
    "prihvacen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PravilnikPrihvatanje_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PravilnikPrihvatanje_userId_verzijaId_key" ON "PravilnikPrihvatanje"("userId", "verzijaId");
CREATE INDEX "PravilnikPrihvatanje_userId_idx" ON "PravilnikPrihvatanje"("userId");

ALTER TABLE "PravilnikPrihvatanje" ADD CONSTRAINT "PravilnikPrihvatanje_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PravilnikPrihvatanje" ADD CONSTRAINT "PravilnikPrihvatanje_verzijaId_fkey" FOREIGN KEY ("verzijaId") REFERENCES "PravilnikVerzija"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: prva verzija v3.7.0
INSERT INTO "PravilnikVerzija" (id, verzija, naslov, "efektivnaOd", kreirao, "createdAt")
VALUES (gen_random_uuid(), '3.7.0', 'Pravilnik o KOLO sistemu — Verzija 3.7.0', NOW(), '84f637eb-f3d5-4a24-843e-66d5154ef888', NOW());
