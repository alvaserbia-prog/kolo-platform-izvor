-- CreateTable
CREATE TABLE "Konverzacija" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Konverzacija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poruka" (
    "id" TEXT NOT NULL,
    "konverzacijaId" TEXT NOT NULL,
    "posiljacId" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "procitana" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poruka_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Konverzacija_user1Id_lastMessageAt_idx" ON "Konverzacija"("user1Id", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "Konverzacija_user2Id_lastMessageAt_idx" ON "Konverzacija"("user2Id", "lastMessageAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Konverzacija_user1Id_user2Id_key" ON "Konverzacija"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Poruka_konverzacijaId_createdAt_idx" ON "Poruka"("konverzacijaId", "createdAt");

-- AddForeignKey
ALTER TABLE "Konverzacija" ADD CONSTRAINT "Konverzacija_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Konverzacija" ADD CONSTRAINT "Konverzacija_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poruka" ADD CONSTRAINT "Poruka_konverzacijaId_fkey" FOREIGN KEY ("konverzacijaId") REFERENCES "Konverzacija"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poruka" ADD CONSTRAINT "Poruka_posiljacId_fkey" FOREIGN KEY ("posiljacId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
