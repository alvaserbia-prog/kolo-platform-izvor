-- Trag da je korisniku javljeno da mu je doprinos sadržaju evidentiran.
--
-- Odvojeno od `evidentiranAt`: zapis POEN-a ne sme da čeka na obaveštenje, a
-- obaveštenje sme da zakasni ili da se nadoknadi ručno. NULL uz status
-- EVIDENTIRAN znači „POEN je upisan, ali čovek još ne zna" — po tome prelazna
-- radnja u adminu nalazi kome duguje javljanje, i zato drugi klik ne javlja dvaput.
--
-- Zatečeni redovi ostaju NULL namerno: doprinosi evidentirani pre ove izmene
-- nisu ispratili nikakvo obaveštenje, pa im se ono duguje.

ALTER TABLE "DoprinosSadrzaju" ADD COLUMN "obavestenAt" TIMESTAMP(3);
