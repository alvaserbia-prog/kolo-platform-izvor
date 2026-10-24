-- Nova vrednost okidača: verifikovan korisnik objavio kvalifikovan oglas.
-- Osnov: Pravilnik o KOLO sistemu 4.1.0 čl. 40a st. 3 (izmena) — verifikovanom
-- korisniku doprinos se evidentira u trenutku objave, ne čeka okidač.
--
-- Zaseban migracioni fajl: Postgres ne dozvoljava korišćenje nove vrednosti enum-a
-- u istoj transakciji u kojoj je dodata, a Prisma svaki fajl vrti kao transakciju.
-- Zato se ovde vrednost samo DODAJE; koristi je aplikacija u radu.

ALTER TYPE "DoprinosOkidac" ADD VALUE IF NOT EXISTS 'OBJAVA_VERIFIKOVAN';
