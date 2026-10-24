-- R-01: identitet utvrđen na donatorskom putu (M-9), ključ uplatioca za
-- proveru duplikata (C-1) i kvačica o nepovratnosti kartične uplate (M-11).
ALTER TABLE "User" ADD COLUMN "identitetUtvrdjenAt" TIMESTAMP(3);

ALTER TABLE "DonationRecord" ADD COLUMN "uplatilacKljuc" TEXT;
ALTER TABLE "DonationRecord" ADD COLUMN "nepovratnostPotvrdjenaAt" TIMESTAMP(3);

CREATE INDEX "DonationRecord_uplatilacKljuc_idx" ON "DonationRecord"("uplatilacKljuc");

-- Zatečeni zapisi NAMERNO ostaju bez ključa uplatioca i bez kvačice: za njih ta
-- provera nije ni rađena, a retroaktivno izveden ključ tvrdio bi da jeste.
-- Isti postupak kao sa `ugovorTekst` i `uplatilac`.
