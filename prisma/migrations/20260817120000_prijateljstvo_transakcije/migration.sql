-- Modul Deca — nove vrste transakcija za ekonomiju dečjeg prostora.
--
-- ZASEBAN fajl, pre migracije koja uvodi ostalo: Postgres ne dozvoljava da se nova
-- vrednost enum-a UPOTREBI u istoj transakciji u kojoj je dodata. Ovde se ne
-- upotrebljava, ali se pravilo poštuje da se sledeća migracija ne bi zaglavila kad
-- joj se jednom doda backfill koji te vrednosti pominje.
--
-- EMISIJA_PRIJATELJSTVO — 500 POEN obema stranama sklopljenog prijateljstva
-- (Pravilnik o Modulu Deca, čl. 14b). Zaseban tip od EMISIJA_SADRZAJ, da se u
-- istoriji i u opticaju vidi šta je došlo iz dečjeg prostora.
--
-- OTPIS_PRIJATELJSTVO — protivzapis Protokola pri raskidu prijateljstva (čl. 14c)
-- i pri prelasku u punoletstvo (čl. 19). NIJE „poništenje prepisa": ovde se
-- poništava EMISIJA, pa opticaj opada, dok prepis samo seli POEN između dva
-- korisnička zapisa i opticaj ne dira.

ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EMISIJA_PRIJATELJSTVO';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'OTPIS_PRIJATELJSTVO';
