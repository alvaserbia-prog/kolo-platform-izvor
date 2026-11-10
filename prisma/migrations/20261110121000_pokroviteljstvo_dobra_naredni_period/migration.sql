-- Set 5.1.2: pokroviteljstvo dobrima i uslugama — doprinos se beleži zaključenjem ugovora,
-- a evidentira u narednom obračunskom periodu (donacije čl. 33 st. 1, Pravilnik čl. 37 st. 1);
-- STIPS cena kao izvor cene (donacije čl. 29 st. 1). Zatečeni redovi ostaju bez izmene.
ALTER TABLE "UgovorDobra" ADD COLUMN     "cekaPeriod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stipsCena" DECIMAL(12,2),
ADD COLUMN     "stipsKategorija" TEXT,
ADD COLUMN     "stipsDatumObjave" TIMESTAMP(3),
ADD COLUMN     "stipsUnetaAt" TIMESTAMP(3),
ADD COLUMN     "stipsUneoId" TEXT;
