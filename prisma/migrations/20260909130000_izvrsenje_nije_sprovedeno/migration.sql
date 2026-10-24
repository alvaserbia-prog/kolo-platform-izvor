-- Nova vrednost enum-a u ZASEBNOM fajlu: Postgres ne dozvoljava upotrebu vrednosti
-- dodate sa ALTER TYPE ... ADD VALUE u istoj transakciji u kojoj je dodata.
ALTER TYPE "IzvrsenjeStatus" ADD VALUE 'NIJE_SPROVEDENO';
