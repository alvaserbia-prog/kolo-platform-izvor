-- Pravilnik o Gornjem Kolu 5.0, čl. 9–11, 13, 19: predlog podnosi svaki učesnik,
-- u narednom obračunskom periodu ga podržavaju čuvari Kola u sastavu Gornjeg Kola,
-- a o podržanom predlogu glasa se u periodu posle podrške. Nepodržan predlog se
-- zatvara i upisuje u registar kao predlog o kome se nije glasalo.
--
-- Novi tip enum-a nastaje u ovom fajlu (CREATE TYPE, ne ALTER TYPE ... ADD VALUE),
-- pa ga sme i koristiti.

CREATE TYPE "NeglasanjeRazlog" AS ENUM ('NEPODRZAN', 'NEDOPUSTEN');

ALTER TABLE "GlasanjePredlog" ADD COLUMN IF NOT EXISTS "podrskaPocetak" TIMESTAMP(3);
ALTER TABLE "GlasanjePredlog" ADD COLUMN IF NOT EXISTS "neglasanjeRazlog" "NeglasanjeRazlog";

CREATE TABLE "GlasanjePodrska" (
    "id" TEXT NOT NULL,
    "predlogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podnosenjem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlasanjePodrska_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlasanjePodrska_predlogId_userId_key" ON "GlasanjePodrska"("predlogId", "userId");
CREATE INDEX "GlasanjePodrska_predlogId_idx" ON "GlasanjePodrska"("predlogId");

ALTER TABLE "GlasanjePodrska" ADD CONSTRAINT "GlasanjePodrska_predlogId_fkey" FOREIGN KEY ("predlogId") REFERENCES "GlasanjePredlog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlasanjePodrska" ADD CONSTRAINT "GlasanjePodrska_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
