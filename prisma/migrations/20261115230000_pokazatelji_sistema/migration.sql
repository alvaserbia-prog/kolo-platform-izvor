-- Pokazatelji sistema (odluka vlasnika 15.11.2026): dnevni snimak zbirnih brojeva iz
-- kojih se računaju četiri pokazatelja. Bez ijednog identifikatora lica. Tabela
-- "PokazateljDan" (raniji pokazatelji zdravlja i koncentracije) ostaje kao istorija.
-- Niz unazad od juna 2026. popunjava `scripts/popuni-pokazatelje-sistema.sql`.

-- CreateTable
CREATE TABLE IF NOT EXISTS "PokazateljSistemaDan" (
    "date" DATE NOT NULL,
    "vrednosti" JSONB NOT NULL,
    "naknadno" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PokazateljSistemaDan_pkey" PRIMARY KEY ("date")
);
