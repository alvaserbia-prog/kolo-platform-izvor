-- Dečja Pričaonica — odvojena soba (Modul Deca, čl. 12).
-- Zatečene poruke ostaju u sobi odraslih; podrazumevana vrednost to i radi.
CREATE TYPE "ChatSoba" AS ENUM ('ODRASLI', 'DECA');
ALTER TABLE "ChatMessage" ADD COLUMN "soba" "ChatSoba" NOT NULL DEFAULT 'ODRASLI';
DROP INDEX IF EXISTS "ChatMessage_createdAt_idx";
CREATE INDEX "ChatMessage_soba_createdAt_idx" ON "ChatMessage"("soba", "createdAt" DESC);
