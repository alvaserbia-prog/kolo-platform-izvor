-- AlterTable
ALTER TABLE "UserPodaci" ADD COLUMN     "prikaziBilans" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prikaziLokaciju" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prikaziOglase" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prikaziOpis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prikaziPunoIme" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prikaziRangDonacija" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prikaziRangPreporuka" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prikaziTelefon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prikaziZrno" BOOLEAN NOT NULL DEFAULT true;
