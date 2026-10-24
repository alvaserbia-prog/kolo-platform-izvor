-- CreateTable
CREATE TABLE "UserPodaci" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ime" TEXT,
    "prezime" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPodaci_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPodaci_userId_key" ON "UserPodaci"("userId");

-- AddForeignKey
ALTER TABLE "UserPodaci" ADD CONSTRAINT "UserPodaci_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
