-- Modul Deca — prijateljstva i jednokratni kod za povezivanje.

CREATE TABLE "Prijateljstvo" (
    "id" TEXT NOT NULL,
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prijateljstvo_pkey" PRIMARY KEY ("id")
);

-- Par se upisuje sortirano (manji id prvi), pa jedinstveni indeks stvarno
-- sprečava dvostruko prijateljstvo istog para u dva smera.
CREATE UNIQUE INDEX "Prijateljstvo_aId_bId_key" ON "Prijateljstvo"("aId", "bId");
CREATE INDEX "Prijateljstvo_aId_idx" ON "Prijateljstvo"("aId");
CREATE INDEX "Prijateljstvo_bId_idx" ON "Prijateljstvo"("bId");

ALTER TABLE "Prijateljstvo" ADD CONSTRAINT "Prijateljstvo_aId_fkey"
  FOREIGN KEY ("aId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prijateljstvo" ADD CONSTRAINT "Prijateljstvo_bId_fkey"
  FOREIGN KEY ("bId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PrijateljToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "korisnikId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "iskoriscen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrijateljToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrijateljToken_token_key" ON "PrijateljToken"("token");
CREATE INDEX "PrijateljToken_korisnikId_idx" ON "PrijateljToken"("korisnikId");
CREATE INDEX "PrijateljToken_expiresAt_idx" ON "PrijateljToken"("expiresAt");

ALTER TABLE "PrijateljToken" ADD CONSTRAINT "PrijateljToken_korisnikId_fkey"
  FOREIGN KEY ("korisnikId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
