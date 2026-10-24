-- Tabla zahteva za jemstvo prestaje da postoji — brišu se PODACI.
-- Osnov: Pravilnik 4.1.0 čl. 32 st. 4 (kontakt radi verifikacije uspostavlja se
-- kroz platformski prostor za oglašavanje), Uslovi čl. 14 i 16 (brisani),
-- Politika privatnosti / DPIA / Registar radnji obrade 4.1.0 (radnja obrade
-- „kartica prepoznavanja" brisana u celosti).
--
-- Kartica je nosila ime, prezime, godište, mesto, nadimak, čime se bavi i telefon.
-- To je bila najosetljivija obrada ličnih podataka u sistemu. Minimizacija (GDPR
-- čl. 5 st. 1 t. c) ne čeka uklanjanje same strukture — podaci odlaze odmah.
--
-- STRUKTURA (tabele "ZahtevZaJemstvo", "Prepoznavanje", tip "JemstvoStatus") ostaje
-- jedan ciklus radi povratka, po konvenciji repozitorijuma. Uklanja je posebna
-- migracija `_tabla_jemstva_drop`.
--
-- Zaseban fajl je nužan: vrednost enuma dodata u prethodnoj migraciji
-- ("EMISIJA_SADRZAJ") ne sme da se koristi u istoj transakciji u kojoj je dodata,
-- pa se migracije razdvajaju.

DELETE FROM "Prepoznavanje";
DELETE FROM "ZahtevZaJemstvo";
