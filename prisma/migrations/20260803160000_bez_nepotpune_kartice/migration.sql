-- ISPRAVKA: popunjenost kartice NE SME biti uslov za verifikaciju.
--
-- Redizajn je zatečene objave (slobodan tekst) prebacio u status NEPOTPUN, a
-- verifikacija sa table prihvata samo AKTIVAN — pa te ljude odjednom niko nije
-- mogao da verifikuje, iako ih neko stvarno poznaje. Verifikuje se ČOVEK, ne
-- kartica; prazna polja smeju uticati samo na redosled u feed-u.
--
-- Kartice se vraćaju u redovan tok. Legacy tekst ostaje u `legacyTekst` i dalje
-- se prikazuje; vlasnik i dalje dobija poziv da dopuni karticu, ali kao savet.
--
-- Enum vrednost NEPOTPUN se namerno NE briše iz tipa (PostgreSQL to ne dozvoljava
-- bez ponovnog kreiranja tipa) — ostaje neiskorišćena i kod je više ne upisuje.

UPDATE "ZahtevZaJemstvo"
SET "status" = 'AKTIVAN'
WHERE "status" = 'NEPOTPUN';
