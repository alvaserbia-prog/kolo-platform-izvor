-- Set 5.1.4: dopunski rok kolektivne nabavke (Pravilnik o projektima i kolektivnim nabavkama
-- čl. 26; odluka vlasnika 10.11.2026). Posle isteka perioda preuzimanja nepreuzeti delovi se
-- 3 dana nude onima koji su u toj nabavci preuzeli deo, po redu iz čl. 20, po jedan deo po
-- korisniku u svakom krugu. Nov tip enum-a (CREATE TYPE), ne nova vrednost postojećeg.

-- CreateEnum
CREATE TYPE "NabavkaDodatniStatus" AS ENUM ('ZATRAZEN', 'DODELJEN', 'PREUZEO', 'OSLOBODJEN', 'ODUSTAO', 'NIJE_DODELJEN');

-- AlterTable — zatečeni redovi ostaju NULL (pravilo 11).
ALTER TABLE "Nabavka" ADD COLUMN IF NOT EXISTS "nabavljenoDelova" INTEGER;
ALTER TABLE "Nabavka" ADD COLUMN IF NOT EXISTS "dopunskiOtvorenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NabavkaDodatniDeo" (
    "id" TEXT NOT NULL,
    "nabavkaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "NabavkaDodatniStatus" NOT NULL DEFAULT 'ZATRAZEN',
    "krug" INTEGER,
    "rezervisano" INTEGER NOT NULL DEFAULT 0,
    "kod" TEXT,
    "zatrazenoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dodeljenoAt" TIMESTAMP(3),
    "preuzetoAt" TIMESTAMP(3),
    "zatvorenoAt" TIMESTAMP(3),

    CONSTRAINT "NabavkaDodatniDeo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NabavkaDodatniDeo_kod_key" ON "NabavkaDodatniDeo"("kod");
CREATE INDEX "NabavkaDodatniDeo_nabavkaId_status_idx" ON "NabavkaDodatniDeo"("nabavkaId", "status");
CREATE INDEX "NabavkaDodatniDeo_userId_status_idx" ON "NabavkaDodatniDeo"("userId", "status");

-- AddForeignKey
ALTER TABLE "NabavkaDodatniDeo" ADD CONSTRAINT "NabavkaDodatniDeo_nabavkaId_fkey" FOREIGN KEY ("nabavkaId") REFERENCES "Nabavka"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NabavkaDodatniDeo" ADD CONSTRAINT "NabavkaDodatniDeo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
