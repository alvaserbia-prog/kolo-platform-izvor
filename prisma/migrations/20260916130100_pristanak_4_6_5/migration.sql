-- Pristanak na akte 4.6.5.
--
-- Set 4.6.5 menja KADA član dobija POEN po potvrdi: 1.000 verifikatoru i 1.000
-- verifikovanom više ne nastaju u trenutku potvrde nego kad potvrđeni korisnik
-- ostvari prvi potvrđen doprinos (dokaz stvarnosti čl. 7, Pravilnik čl. 15 t. 2 i
-- čl. 40a). To dodiruje svakog člana, pa Uslovi čl. 40 i Politika čl. 16 traže
-- obaveštenje bez odlaganja i ponovnu saglasnost.
--
-- Prekidač `PRISTANAK_NA_AKTE_TRAZI_SE` je od 14.09.2026. upaljen, ali sam po sebi
-- ništa ne prikazuje: `pristanakStatus()` poredi poslednju verziju sa prihvaćenom,
-- pa bez ovog reda ekran „Sistem je unapređen — novi akti" ćuti, jer je zatečena
-- verzija 4.6.3 već prihvaćena.
--
-- 🔴 `ON CONFLICT DO NOTHING` — drugi red bi tražio pristanak na verziju koja je
-- već prihvaćena.
--
-- Ide migracijom, ne admin dugmetom: ovde se ne emituje nijedan POEN niti dira
-- opticaj, pa nema šta da čeka na ljudski potez. Presedan:
-- `20260810170000_pristanak_4_2_1` i `20260914130000_pristanak_4_6_3`.
INSERT INTO "PolitikaVerzija" ("id", "verzija", "naslov", "efektivnaOd", "kreirao", "createdAt")
VALUES (gen_random_uuid()::text, '4.6.5', 'Akti KOLO sistema 4.6.5', NOW(), 'migracija-4.6.5', NOW())
ON CONFLICT ("verzija") DO NOTHING;
