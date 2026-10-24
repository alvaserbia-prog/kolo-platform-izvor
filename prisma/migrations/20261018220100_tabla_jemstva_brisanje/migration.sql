-- Tabla zahteva za jemstvo je ukinuta (Pravilnik 4.1.1 čl. 32 st. 4), a kartice
-- prepoznavanja su ostale u bazi sa imenom, prezimenom, godištem, mestom,
-- nadimkom i telefonom. Svrha je prestala, pa se podaci brišu (odluka vlasnika,
-- 18.10.2026). Odgovori „Poznaješ li ovu osobu?" padaju kaskadno.
-- Tabela ostaje (šema i stari linkovi `/tabla-jemstva`), samo bez redova.
DELETE FROM "ZahtevZaJemstvo";
