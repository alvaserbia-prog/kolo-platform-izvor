-- Dnevnik aktivnosti prijavljenih korisnika (poseta stranica).
-- Retencija 12 meseci (GDPR cron); vidljivo samo superadminu.

-- CreateTable
CREATE TABLE "AktivnostLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "putanja" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AktivnostLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AktivnostLog_userId_createdAt_idx" ON "AktivnostLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AktivnostLog_createdAt_idx" ON "AktivnostLog"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AktivnostLog" ADD CONSTRAINT "AktivnostLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
