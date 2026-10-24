-- CreateTable
CREATE TABLE "DonationRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountRSD" DECIMAL(12,2) NOT NULL,
    "cumulativeRSD" DECIMAL(12,2) NOT NULL,
    "level" INTEGER NOT NULL,
    "poenEmitted" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DonationRecord" ADD CONSTRAINT "DonationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
