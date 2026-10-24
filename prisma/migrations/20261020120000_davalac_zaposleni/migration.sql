-- Zaposleni davaoca (donacije čl. 13g st. 6, nabavke čl. 30g st. 1, set 4.7.8):
-- podnosilac prijave određuje korisnike koji u ime davaoca potvrđuju vaučere.

-- AlterTable
ALTER TABLE "Vaucer" ADD COLUMN "potvrdioId" TEXT;

-- CreateTable
CREATE TABLE "DavalacZaposleni" (
    "id" TEXT NOT NULL,
    "davalacUserId" TEXT NOT NULL,
    "zaposleniUserId" TEXT NOT NULL,
    "dodatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opozvanAt" TIMESTAMP(3),
    "opozvanRazlog" TEXT,

    CONSTRAINT "DavalacZaposleni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DavalacZaposleni_davalacUserId_opozvanAt_idx" ON "DavalacZaposleni"("davalacUserId", "opozvanAt");

-- CreateIndex
CREATE INDEX "DavalacZaposleni_zaposleniUserId_opozvanAt_idx" ON "DavalacZaposleni"("zaposleniUserId", "opozvanAt");

-- Najviše jedno AKTIVNO ovlašćenje po paru; opozvani redovi ostaju kao istorija.
-- Delimičan indeks Prisma ne izražava u šemi.
CREATE UNIQUE INDEX "DavalacZaposleni_aktivan_par_key" ON "DavalacZaposleni"("davalacUserId", "zaposleniUserId") WHERE "opozvanAt" IS NULL;

-- Davalac ne može sam sebe odrediti.
ALTER TABLE "DavalacZaposleni" ADD CONSTRAINT "DavalacZaposleni_razlicite_strane" CHECK ("davalacUserId" <> "zaposleniUserId");

-- AddForeignKey
ALTER TABLE "Vaucer" ADD CONSTRAINT "Vaucer_potvrdioId_fkey" FOREIGN KEY ("potvrdioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DavalacZaposleni" ADD CONSTRAINT "DavalacZaposleni_davalacUserId_fkey" FOREIGN KEY ("davalacUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DavalacZaposleni" ADD CONSTRAINT "DavalacZaposleni_zaposleniUserId_fkey" FOREIGN KEY ("zaposleniUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
