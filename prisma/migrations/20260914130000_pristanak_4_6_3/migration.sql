-- Pristanak na akte 4.6.3 — jednokratno, zbog ZATEČENIH naloga (R-06).
--
-- Od seta 4.6.3 registracija i OAuth upisuju dokaz pristanka u istoj transakciji
-- u kojoj nastaje nalog (`upisiPristankeRegistracije`), pa nov čovek pristanak daje
-- kvačicom i ekran „Sistem je unapređen — novi akti" ne vidi. Nalozi otvoreni pre
-- te izmene taj dokaz nemaju, a unazad se ne može napraviti: retroaktivno upisan
-- pristanak bio bi netačan dokument (isto pravilo kao `DonationRecord.ugovorTekst`
-- i `Roditeljstvo.saglasnostAt`). Jedini put je da se pristanak zatraži pri prvoj
-- narednoj prijavi — otud ovaj red i prekidač `PRISTANAK_NA_AKTE_TRAZI_SE = true`.
--
-- Ide migracijom, ne admin dugmetom: ovde se ne emituje nijedan POEN niti dira
-- opticaj, pa nema šta da čeka na ljudski potez.
INSERT INTO "PolitikaVerzija" ("id", "verzija", "naslov", "efektivnaOd", "kreirao", "createdAt")
VALUES (gen_random_uuid()::text, '4.6.3', 'Akti KOLO sistema 4.6.3', NOW(), 'migracija-4.6.3', NOW())
ON CONFLICT ("verzija") DO NOTHING;
