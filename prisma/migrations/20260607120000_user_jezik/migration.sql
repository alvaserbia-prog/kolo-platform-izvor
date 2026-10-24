-- Dodaje izabrani jezik korisnika (next-intl locale) za notifikacije/email i podrazumevani prikaz.
ALTER TABLE "User" ADD COLUMN "jezik" TEXT NOT NULL DEFAULT 'sr';
