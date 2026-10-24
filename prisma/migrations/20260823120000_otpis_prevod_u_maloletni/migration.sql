-- Prevođenje punoletnog naloga u maloletni — protivzapis Protokola.
--
-- OTPIS_PREVOD_U_MALOLETNI pokriva obe strane iste radnje:
--  - detetu se poništava sve što mu je Protokol upisao (potvrde, doprinos
--    sadržaju i razmeni, donacije, programi, pokroviteljstvo) — kanali koje
--    maloletni korisnik ne koristi (Pravilnik o učešću dece čl. 14 st. 1, čl. 15);
--  - ljudima kojima su povodom njegovih potvrda upisani POEN-i skida se taj iznos.
--
-- Poništava se EMISIJA, pa opticaj OPADA — isto što radi OTPIS_PRIJATELJSTVO, a
-- suprotno od PONISTENJE_PREPISA, koje samo seli POEN između dva korisnička zapisa.
--
-- ZASEBAN fajl bez ijedne upotrebe vrednosti: Postgres ne dozvoljava da se nova
-- vrednost enum-a upotrebi u istoj transakciji u kojoj je dodata.

ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'OTPIS_PREVOD_U_MALOLETNI';
