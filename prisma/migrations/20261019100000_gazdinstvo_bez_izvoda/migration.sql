-- Set 4.7.4 (odluka vlasnika): Fondacija ne traži izvod iz Registra poljoprivrednih
-- gazdinstava i ne poredi ime i BPG sa njim, pa se zapis o poređenju ukida.
ALTER TABLE "Gazdinstvo" DROP COLUMN IF EXISTS "rpgUporedjenAt";
ALTER TABLE "Gazdinstvo" DROP COLUMN IF EXISTS "rpgUporedioId";
