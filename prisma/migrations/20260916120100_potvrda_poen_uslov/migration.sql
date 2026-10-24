-- Kolone za odloženi upis POEN-a po potvrdi (dokaz stvarnosti čl. 7, set 4.6.4).
--
-- Do ovog seta je Protokol upisivao 1.000 verifikatoru i 1.000 verifikovanom ODMAH po
-- potvrdi, automatski i bez ijednog traga da je potvrđeni išta uradio. Sada se POEN
-- beleži, a upisuje kad potvrđeni ostvari doprinos koji je NEKO POTVRDIO: odobren prvi
-- oglas, javna donacija, pokroviteljstvo ili verifikovan operativni doprinos.
--
-- 🔴 Sam čin potvrde se ne menja — indeks se puni odmah i nalog je redovan član istog
-- časa. Čeka SAMO zapis POEN-a.
--
-- 🔴 Nadzornikovih 500 ovo NE dodiruje: po čl. 7 st. 2 već imaju svoj trenutak
-- (evidentiranje ishoda nadzora), pa `NadzorZapis` i `nadzorIshod` ostaju netaknuti.
ALTER TABLE "VerifikacionaVeza"
  ADD COLUMN "poenStatus"        "PotvrdaPoenStatus" NOT NULL DEFAULT 'ZABELEZEN',
  ADD COLUMN "poenEvidentiranAt" TIMESTAMP(3),
  ADD COLUMN "poenUslov"         "PotvrdaPoenUslov",
  ADD COLUMN "verifikatorTxId"   TEXT,
  ADD COLUMN "verifikovaniTxId"  TEXT;

-- 🔴 BACKFILL JE OBAVEZAN I MORA BITI OVAKAV. Zatečene potvrde su POEN već upisale po
-- pravilu koje je tada važilo. Bez ovoga bi svaka od njih ostala na podrazumevanom
-- `ZABELEZEN`, pa bi ih noćni prolaz i okidači redom „otključavali" i emitovali POEN
-- DRUGI PUT — dakle dupli upis svakom zatečenom članu i pokvaren zero-sum.
--
-- Isti postupak kao backfill zatečenih nadzora na `UREDNO` u
-- `20260809150000_nadzor_ishod_i_predmet`.
--
-- `poenUslov` ostaje NULL: za zatečene veze uslov nije ni meren, a upisati neku
-- vrednost značilo bi tvrditi činjenicu koja nije utvrđena (isto pravilo kao
-- `ugovorTekst` i `uplatilac` kod zatečenih donacija).
UPDATE "VerifikacionaVeza"
   SET "poenStatus" = 'EVIDENTIRAN',
       "poenEvidentiranAt" = "vremenskiZig";

-- Noćni prolaz i pregled u admin tabu traže zabeležene potvrde po potvrđenom korisniku.
CREATE INDEX "VerifikacionaVeza_verifikovaniId_poenStatus_idx"
  ON "VerifikacionaVeza"("verifikovaniId", "poenStatus");
