-- Delegiranje glasova: zakazane promene (delegacija + opoziv) izvršavaju se u ponoć;
-- lanac delegiranja je tranzitivan (rešava se pri obračunu glasova).

ALTER TABLE "ZrnoDelegacija" ALTER COLUMN "delegatId" DROP NOT NULL;
ALTER TABLE "ZrnoDelegacija" ADD COLUMN "zakazaniDelegatId" TEXT;
ALTER TABLE "ZrnoDelegacija" ADD COLUMN "imaZakazano" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ZrnoDelegacija" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Postojeće pending delegacije (aktivna=false) postaju zakazane promene
UPDATE "ZrnoDelegacija" SET "zakazaniDelegatId" = "delegatId", "delegatId" = NULL, "imaZakazano" = true WHERE "aktivna" = false;

ALTER TABLE "ZrnoDelegacija" DROP COLUMN "aktivna";

ALTER TABLE "ZrnoDelegacija" ADD CONSTRAINT "ZrnoDelegacija_zakazaniDelegatId_fkey" FOREIGN KEY ("zakazaniDelegatId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
