-- Tabla zahteva za jemstvo
-- Neverifikovan korisnik se predstavlja mreži verifikovanih radi kontakta za verifikaciju.

CREATE TYPE "JemstvoStatus" AS ENUM ('AKTIVAN', 'POVUCEN', 'ISTEKAO', 'UKLONJEN', 'ZAVRSEN');

CREATE TABLE "ZahtevZaJemstvo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tekstPredstavljanja" TEXT NOT NULL,
    "kontaktPodaci" TEXT NOT NULL,
    "status" "JemstvoStatus" NOT NULL DEFAULT 'AKTIVAN',
    "uklonjenRazlog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ZahtevZaJemstvo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ZahtevZaJemstvo_userId_idx" ON "ZahtevZaJemstvo"("userId");
CREATE INDEX "ZahtevZaJemstvo_status_idx" ON "ZahtevZaJemstvo"("status");
CREATE INDEX "ZahtevZaJemstvo_expiresAt_idx" ON "ZahtevZaJemstvo"("expiresAt");

ALTER TABLE "ZahtevZaJemstvo" ADD CONSTRAINT "ZahtevZaJemstvo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
