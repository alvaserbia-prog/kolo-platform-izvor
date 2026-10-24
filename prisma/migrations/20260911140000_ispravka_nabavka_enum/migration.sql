-- Nov tip transakcije: ispravka poništenja po iskorišćenju (Pravilnik čl. 14a,
-- nabavke čl. 30a). ZASEBAN fajl — Postgres ne dozvoljava upotrebu nove enum
-- vrednosti u transakciji u kojoj je dodata.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ISPRAVKA_NABAVKA';
