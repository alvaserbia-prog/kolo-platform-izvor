-- Modul Deca — prva verzija (Pravilnik o Modulu Deca).
--
-- Nijedan zatečeni nalog nije maloletan, pa backfill nije potreban: `maloletan`
-- podrazumevano `false` je tačno za sve zatečene redove.

CREATE TYPE "RoditeljstvoPotvrdaStatus" AS ENUM ('CEKA', 'POTVRDIO', 'OSPORIO', 'ISTEKLA');

ALTER TABLE "User" ADD COLUMN     "datumRodjenja" DATE,
                  ADD COLUMN     "maloletan" BOOLEAN NOT NULL DEFAULT false,
                  ADD COLUMN     "roditeljId" TEXT,
                  ADD COLUMN     "dozvolaOdrasli" BOOLEAN NOT NULL DEFAULT false;

-- Svaki javni upit isključuje decu; bez indeksa bi to bio pun prolaz kroz tabelu.
CREATE INDEX "User_maloletan_idx" ON "User"("maloletan");
CREATE INDEX "User_roditeljId_idx" ON "User"("roditeljId");

ALTER TABLE "User" ADD CONSTRAINT "User_roditeljId_fkey"
  FOREIGN KEY ("roditeljId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "RoditeljstvoPotvrda" (
    "id" TEXT NOT NULL,
    "deteId" TEXT NOT NULL,
    "potvrdjivacId" TEXT NOT NULL,
    "status" "RoditeljstvoPotvrdaStatus" NOT NULL DEFAULT 'CEKA',
    "obrazlozenje" TEXT,
    "rokDo" TIMESTAMP(3) NOT NULL,
    "odgovorAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoditeljstvoPotvrda_pkey" PRIMARY KEY ("id")
);

-- Potvrda se daje za svako dete posebno (čl. 6 st. 1).
CREATE UNIQUE INDEX "RoditeljstvoPotvrda_deteId_potvrdjivacId_key"
  ON "RoditeljstvoPotvrda"("deteId", "potvrdjivacId");
CREATE INDEX "RoditeljstvoPotvrda_potvrdjivacId_status_idx"
  ON "RoditeljstvoPotvrda"("potvrdjivacId", "status");
-- Noćni posao traži zapise kojima je rok istekao.
CREATE INDEX "RoditeljstvoPotvrda_status_rokDo_idx"
  ON "RoditeljstvoPotvrda"("status", "rokDo");

ALTER TABLE "RoditeljstvoPotvrda" ADD CONSTRAINT "RoditeljstvoPotvrda_deteId_fkey"
  FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoditeljstvoPotvrda" ADD CONSTRAINT "RoditeljstvoPotvrda_potvrdjivacId_fkey"
  FOREIGN KEY ("potvrdjivacId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
