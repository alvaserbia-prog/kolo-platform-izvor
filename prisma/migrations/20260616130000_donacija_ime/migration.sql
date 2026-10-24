-- Trajan snapshot imena donatora za javnu donaciju (čl. 5a). Beleži se u
-- trenutku evidentiranja i ostaje kao deo zapisa donacije, nezavisno od profila.
-- Null za anonimne i istorijske donacije → ne prikazuju se u listi donacija.
ALTER TABLE "DonationRecord" ADD COLUMN "donatorIme" TEXT;
