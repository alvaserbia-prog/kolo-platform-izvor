-- Uklanjanje @unique sa VerifikacionaVeza.verifikovaniId
-- Bug: zbog UNIQUE indeksa korisnik je mogao imati najviše JEDNOG verifikatora,
-- pa indeks stvarnosti nije mogao preći 10% (izracunajIndeks = brojVerifikacija × 10).
-- Dizajn (Pravilnik o dokazu stvarnosti čl. 3) predviđa 1 početni + do 10 ličnih
-- verifikacija = do 100%. Skida se UNIQUE; non-unique indeks za pretragu ostaje
-- (VerifikacionaVeza_verifikovaniId_idx je već kreiran ranijom migracijom).

DROP INDEX IF EXISTS "VerifikacionaVeza_verifikovaniId_key";
