-- Set 4.8.0 — ukinuta putanja doprinosa razmeni (Pravilnik o KOLO sistemu čl. 40b
-- brisan) i krug poznanstava (dokaz stvarnosti, bivša zabranjena zona); odluka
-- vlasnika 20.10.2026.
--
-- 1) `OglasUpit` — ko se javio povodom čijeg oglasa. Podatak je služio samo koraku 3
--    putanje; svrha je prestala, pa se zatečeni zapisi brišu zajedno sa tabelom
--    (Politika 4.10, Registar radnja br. 15 — prestala).
-- 2) `verification_zone` — keš zabranjene zone, izveden iz grafa verifikacija.
--    Nije izvor ničega; potvrđivanje (čl. 12) čita same veze.
--
-- `DoprinosRazmeni` i enum `EMISIJA_RAZMENA` OSTAJU (pravilo: tabele i enum vrednosti
-- ukinutih kanala se ne brišu). Tabela je prazna i na produkciji i na testu.
--
-- Idempotentno (P3009 pouka).

DROP TABLE IF EXISTS "OglasUpit";
DROP TABLE IF EXISTS "verification_zone";
