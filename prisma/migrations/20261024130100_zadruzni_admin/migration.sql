-- Registar rizika 2026-10, U2: zadruga za koju radi nalog sa nivoom ZADRUGA.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminZadrugaId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_adminZadrugaId_fkey" FOREIGN KEY ("adminZadrugaId") REFERENCES "Krug"("id") ON DELETE SET NULL ON UPDATE CASCADE;
