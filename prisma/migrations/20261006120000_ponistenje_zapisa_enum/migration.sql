-- Poništenje zapisa POEN-a uz protivzapis Protokola (Pravilnik čl. 34).
--
-- Gašenje naloga, poništenje lažne potvrde i brisanje dečjeg naloga su do sada
-- upisivani kao TRANSFER, pa su se brojali kao razmena među članovima i ulazili
-- u zbir prepisa. Protivzapis ide sopstvenim tipom (pravilo 5).
--
-- Zatečeni redovi se NE prevode u novi tip — istorija se ne prepravlja (čl. 34);
-- brojač razmena ih isključuje uslovom da Protokol nije strana u prepisu.
--
-- ZASEBAN fajl bez ijedne upotrebe vrednosti: Postgres ne dozvoljava da se nova
-- vrednost enum-a upotrebi u istoj transakciji u kojoj je dodata.

ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PONISTENJE_ZAPISA';
