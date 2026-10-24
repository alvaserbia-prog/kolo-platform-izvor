-- Potvrda imejl adrese koju maloletni korisnik sam upiše.
--
-- Adresa se do potvrde NE upisuje u "User"."email" — dok red ovde ne dobije
-- "usedAt", upisana adresa ne radi ništa. Razlog je u komentaru uz model:
-- reset lozinke ide na tu adresu, pa bi omaška u kucanju predala tuđoj osobi
-- ključ od dečjeg naloga.

CREATE TABLE "EmailPotvrda" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailPotvrda_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailPotvrda_tokenHash_key" ON "EmailPotvrda"("tokenHash");
CREATE INDEX "EmailPotvrda_userId_idx" ON "EmailPotvrda"("userId");
CREATE INDEX "EmailPotvrda_expiresAt_idx" ON "EmailPotvrda"("expiresAt");

ALTER TABLE "EmailPotvrda"
  ADD CONSTRAINT "EmailPotvrda_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
