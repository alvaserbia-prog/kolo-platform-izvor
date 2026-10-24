-- Pristanak na akte 4.2.1.
--
-- Akti stupaju na snagu danom donošenja (odluka vlasnika), ali se svakome ko se
-- prijavi prikazuje ekran „Sistem je unapređen — novi akti" sa dugmetom
-- „Pristajem" (Uslovi čl. 40, Politika čl. 16). Gejt već postoji u AppShell-u;
-- ovde se samo pali.
--
-- Ide migracijom, ne admin dugmetom: ovde se ne emituje nijedan POEN niti dira
-- opticaj, pa nema šta da čeka na ljudski potez.
INSERT INTO "PolitikaVerzija" ("id", "verzija", "naslov", "efektivnaOd", "kreirao", "createdAt")
VALUES (gen_random_uuid()::text, '4.2.1', 'Akti KOLO sistema 4.2.1', NOW(), 'migracija-4.2.1', NOW())
ON CONFLICT ("verzija") DO NOTHING;
