-- Web Push pretplate uređaja (browser Push API). Više pretplata po korisniku
-- (više uređaja/browsera); kaskadno brisanje pri brisanju naloga.
CREATE TABLE "PushPretplata" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushPretplata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushPretplata_endpoint_key" ON "PushPretplata"("endpoint");

CREATE INDEX "PushPretplata_userId_idx" ON "PushPretplata"("userId");

ALTER TABLE "PushPretplata" ADD CONSTRAINT "PushPretplata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
