-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('PRIJAVLJEN', 'U_RADU', 'RESENO', 'ODBIJENO');

-- CreateTable
CREATE TABLE "Bug" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "naslov" TEXT NOT NULL,
    "opis" TEXT NOT NULL,
    "status" "BugStatus" NOT NULL DEFAULT 'PRIJAVLJEN',
    "odgovor" TEXT,
    "resenoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bug_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bug_status_createdAt_idx" ON "Bug"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Bug_userId_idx" ON "Bug"("userId");

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
