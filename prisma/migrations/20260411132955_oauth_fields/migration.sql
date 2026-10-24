-- AlterTable
ALTER TABLE "User" ADD COLUMN     "oauthId" TEXT,
ADD COLUMN     "oauthPending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oauthProvider" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;
