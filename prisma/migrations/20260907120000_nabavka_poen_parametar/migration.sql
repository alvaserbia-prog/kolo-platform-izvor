-- Kolektivna nabavka: broj POEN-a po delu je PARAMETAR ODLUKE, ne izvod iz cene.
--
-- Do seta 4.4.3 se računao kao `velicinaDela × maloprodajna referenca`, u odnosu
-- jedan prema jedan (čl. 19). Time je svaka objavljena nabavka bila javan dokaz
-- odnosa POEN-a prema dinaru, pa se i tabela koeficijenta donacija čitala kao
-- cenovnik. Sada broj utvrđuje odluka kojom se nabavka pokreće i objavljuje se uz
-- obrazloženje (čl. 17), a maloprodajna referenca kao institut više ne postoji.
--
-- Kolone se brišu, a ne ostavljaju: `maloprodajna` je snimljen KURS, i dok stoji na
-- zapisu, iz objavljene nabavke se i dalje može očitati koliko POEN vredi u
-- dinarima. Zero-sum se ovim ne dira — nijedna kolona ne nosi zapis POEN-a.
ALTER TABLE "Nabavka" ADD COLUMN "poenObrazlozenje" TEXT;
ALTER TABLE "Nabavka" DROP COLUMN "maloprodajna";
ALTER TABLE "Nabavka" DROP COLUMN "izvoriCena";
