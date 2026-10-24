-- Putanja doprinosa razmeni bez obostranog označavanja razmene.
--
-- Odluka vlasnika (2026-08-09): razmena se NE označava ručno i ne vodi se kao
-- zaseban zapis. U brojač lestvice ulaze sami upisi POEN-a — svaki sagovornik van
-- kruga poznanstava (van grafa verifikacija) broji se jednom. Time otpada i
-- pravilo o povratnom toku POEN-a u roku od 60 dana: nema šta da obara razmenu
-- koja se više i ne evidentira posebno.
--
-- Zato se tabela "Razmena" i tip "RazmenaStatus", uvedeni migracijom
-- 20260809160000_doprinos_razmeni, uklanjaju. Prethodna migracija se NE menja —
-- ako je već primenjena na neko okruženje, izmena njenog sadržaja bi oborila
-- kontrolni zbir i time i deploy. IF EXISTS pokriva oba slučaja.
--
-- Ostaje sve što lestvica i dalje koristi: "DoprinosRazmeni" (koraci 2–5),
-- "OglasUpit" (korak 3) i tip transakcije EMISIJA_RAZMENA.

DROP TABLE IF EXISTS "Razmena";
DROP TYPE IF EXISTS "RazmenaStatus";
