-- Prepis POEN-a iz zapisa maloletnog korisnika iznad praga čeka odobrenje roditelja
-- (Pravilnik o učešću dece, čl. 14). Red drži NAMERU, ne transakciju: POEN se ne
-- pomera dok roditelj ne odobri, pa zero-sum ovo ne dodiruje.
CREATE TYPE "PrepisOdobrenjeStatus" AS ENUM ('CEKA', 'ODOBREN', 'ODBIJEN', 'ISTEKAO');

CREATE TABLE "PrepisOdobrenje" (
  "id"         TEXT NOT NULL,
  "deteId"     TEXT NOT NULL,
  "primalacId" TEXT NOT NULL,
  "iznos"      INTEGER NOT NULL,
  "opis"       TEXT,
  "status"     "PrepisOdobrenjeStatus" NOT NULL DEFAULT 'CEKA',
  "rokDo"      TIMESTAMP(3) NOT NULL,
  "odlucioId"  TEXT,
  "odlucenoAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrepisOdobrenje_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrepisOdobrenje_deteId_status_idx" ON "PrepisOdobrenje"("deteId", "status");
CREATE INDEX "PrepisOdobrenje_status_rokDo_idx" ON "PrepisOdobrenje"("status", "rokDo");

ALTER TABLE "PrepisOdobrenje" ADD CONSTRAINT "PrepisOdobrenje_deteId_fkey"
  FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrepisOdobrenje" ADD CONSTRAINT "PrepisOdobrenje_primalacId_fkey"
  FOREIGN KEY ("primalacId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
