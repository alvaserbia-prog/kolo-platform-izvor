-- CreateTable
CREATE TABLE "Notifikacija" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "naslov" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "procitana" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifikacija_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notifikacija_userId_procitana_idx" ON "Notifikacija"("userId", "procitana");

-- CreateIndex
CREATE INDEX "Notifikacija_userId_createdAt_idx" ON "Notifikacija"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Notifikacija" ADD CONSTRAINT "Notifikacija_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
