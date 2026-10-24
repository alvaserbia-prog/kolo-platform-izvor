-- Nadzornikovih 500 čekaju isti uslov kao POEN po potvrdi (odluka vlasnika,
-- 16.09.2026; dokaz stvarnosti čl. 7).
--
-- Do ovog seta su 500 POEN-a nastajali u trenutku upisa ishoda nadzora, nezavisno od
-- toga da li je potvrđeni korisnik išta doprineo. Sada čekaju isti trag stvarnog
-- učešća kao i 1.000 + 1.000 po samoj potvrdi.
--
-- 🔴 ZASEBAN SKUP POLJA, ne `poenStatus`: nadzornikova emisija ima svoj trenutak
-- nastanka (upis ishoda), različit od trenutka potvrde — nadzornik ume da upiše ishod
-- i pre i posle nego što uslov bude ispunjen. Sa jednim poljem se ne bi razlikovalo
-- „nije upisano jer ishoda nema" od „nije upisano jer uslov nije ispunjen", pa bi
-- kaskada vraćala POEN koji nikad nije emitovan.
ALTER TABLE "VerifikacionaVeza"
  ADD COLUMN "nadzorPoenStatus"        "PotvrdaPoenStatus" NOT NULL DEFAULT 'ZABELEZEN',
  ADD COLUMN "nadzorPoenEvidentiranAt" TIMESTAMP(3),
  ADD COLUMN "nadzorTxId"              TEXT;

-- 🔴 BACKFILL: gde je ishod nadzora već upisan, 500 POEN-a je po ranijem pravilu već
-- emitovano — te veze idu na EVIDENTIRAN. Bez toga bi ih okidači i noćni prolaz
-- „otključali" i emitovali POEN DRUGI put svakom zatečenom nadzorniku.
--
-- Veze bez ishoda ostaju na ZABELEZEN i to je tačno: po njima ništa nije ni emitovano,
-- a nadzornik još nije ni određen.
UPDATE "VerifikacionaVeza"
   SET "nadzorPoenStatus" = 'EVIDENTIRAN',
       "nadzorPoenEvidentiranAt" = "nadzoranAt"
 WHERE "nadzoranAt" IS NOT NULL;
