-- Potvrda postojanja deteta od strane Fondacije (Pravilnik o učešću dece čl. 6, set 4.8.0).
CREATE TABLE IF NOT EXISTS "RoditeljstvoPotvrdaFondacije" (
    "id" TEXT NOT NULL,
    "deteId" TEXT NOT NULL,
    "roditeljId" TEXT NOT NULL,
    "status" "RoditeljstvoPotvrdaStatus" NOT NULL DEFAULT 'CEKA',
    "odlucioId" TEXT,
    "obrazlozenje" TEXT,
    "odgovorAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoditeljstvoPotvrdaFondacije_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoditeljstvoPotvrdaFondacije_deteId_roditeljId_key" ON "RoditeljstvoPotvrdaFondacije"("deteId", "roditeljId");
CREATE INDEX IF NOT EXISTS "RoditeljstvoPotvrdaFondacije_status_idx" ON "RoditeljstvoPotvrdaFondacije"("status");

ALTER TABLE "RoditeljstvoPotvrdaFondacije" ADD CONSTRAINT "RoditeljstvoPotvrdaFondacije_deteId_fkey" FOREIGN KEY ("deteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoditeljstvoPotvrdaFondacije" ADD CONSTRAINT "RoditeljstvoPotvrdaFondacije_roditeljId_fkey" FOREIGN KEY ("roditeljId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoditeljstvoPotvrdaFondacije" ADD CONSTRAINT "RoditeljstvoPotvrdaFondacije_odlucioId_fkey" FOREIGN KEY ("odlucioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
