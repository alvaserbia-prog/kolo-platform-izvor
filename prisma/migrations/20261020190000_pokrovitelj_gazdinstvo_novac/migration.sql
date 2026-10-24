-- Novčano pokroviteljstvo registrovanog poljoprivrednog gazdinstva (Pravilnik o
-- pokroviteljstvu i donacijama čl. 6 i 10, set 4.7.9; odluka vlasnika 20.10.2026).
--
-- Novčani pokrovitelj se do sada vodio samo po PIB-u. Gazdinstvo PIB nema obavezno,
-- pa se vodi po BPG-u: `Pokrovitelj.pib` postaje neobavezan (jedinstvenost ostaje —
-- NULL se u Postgresu ne sudara), uz nov jedinstven `bpg`. Zatečeni redovi imaju PIB
-- i ostaju netaknuti. Enum `VrstaDavaoca` već postoji (20261020140000), pa nova
-- vrednost enuma ne nastaje.
--
-- Idempotentno (P3009 pouka): ponovno izvršavanje ne pada.

ALTER TABLE "Pokrovitelj" ALTER COLUMN "pib" DROP NOT NULL;
ALTER TABLE "Pokrovitelj" ADD COLUMN IF NOT EXISTS "bpg" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Pokrovitelj_bpg_key" ON "Pokrovitelj"("bpg");

ALTER TABLE "PokroviteljPrijava" ALTER COLUMN "pib" DROP NOT NULL;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "bpg" TEXT;
ALTER TABLE "PokroviteljPrijava" ADD COLUMN IF NOT EXISTS "vrstaDavaoca" "VrstaDavaoca" NOT NULL DEFAULT 'FIRMA';
