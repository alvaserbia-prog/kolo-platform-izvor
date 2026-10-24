-- Prvi prolaz kroz vodič `/dobrodosli` seli se iz pregledača u bazu.
--
-- Do sada je „ovo je prvi put" bio zapis u `sessionStorage` koji postavlja samo
-- registracija. Posledica: ko se registruje pa zatvori prozor, vodič više nikad
-- ne vidi automatski; a nalog vraćen na dan registracije (admin reset) nije ni
-- mogao da ga dobije, jer server ne dopire do memorije pregledača.
ALTER TABLE "User" ADD COLUMN "vodicVidjenAt" TIMESTAMP(3);

-- Zatečeni nalozi su svoj prvi dolazak odavno prošli — popunjavamo ih tekućim
-- vremenom da im se vodič ne otvori pri prvoj sledećoj prijavi. Novi nalozi
-- ostaju NULL (podrazumevano) i vodič dobijaju.
UPDATE "User" SET "vodicVidjenAt" = CURRENT_TIMESTAMP;
