/*
  Warnings:

  - You are about to drop the column `ime` on the `UserPodaci` table. All the data in the column will be lost.
  - You are about to drop the column `prezime` on the `UserPodaci` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserPodaci" DROP COLUMN "ime",
DROP COLUMN "prezime",
ADD COLUMN     "punoIme" TEXT;
