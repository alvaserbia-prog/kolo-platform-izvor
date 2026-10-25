-- Pokazatelji zdravlja i koncentracije (odluke vlasnika 25.10.2026).
-- Dnevni snimak bez identifikatora lica i stanje „stalne ponude“ gazdinstva (Z5).
CREATE TABLE IF NOT EXISTS "PokazateljDan" (
    "date" DATE NOT NULL,
    "vrednosti" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PokazateljDan_pkey" PRIMARY KEY ("date")
);

ALTER TABLE "Gazdinstvo" ADD COLUMN IF NOT EXISTS "ponudaNeprekidnoOd" TIMESTAMP(3);
