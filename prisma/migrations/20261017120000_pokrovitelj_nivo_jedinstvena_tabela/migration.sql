-- Set 4.6.8 (čl. 10 Pravilnika o pokroviteljstvu i donacijama): pokroviteljstvo
-- ide po istoj tabeli kao donacija fizičkog lica, sa istom numeracijom nivoa
-- (10.000 RSD = nivo 3). Do sada je numeracija pokroviteljstva bila pomerena za
-- dva (10.000 RSD = nivo 1). Nivo se izvodi iz kumulativa, pa se zatečeni broj
-- ponovo izračunava iz "rsdKumulativ" pragovima iz `pragZaNivo()`
-- (src/lib/donacija-pravila.ts). Istorijski "PokroviteljBonusEmisija"."nivo" se ne dira.
UPDATE "Pokrovitelj"
SET "trenutniNivo" = CASE
    WHEN "rsdKumulativ" >= 10000000000 THEN 21
    WHEN "rsdKumulativ" >= 5000000000 THEN 20
    WHEN "rsdKumulativ" >= 2000000000 THEN 19
    WHEN "rsdKumulativ" >= 1000000000 THEN 18
    WHEN "rsdKumulativ" >= 500000000 THEN 17
    WHEN "rsdKumulativ" >= 200000000 THEN 16
    WHEN "rsdKumulativ" >= 100000000 THEN 15
    WHEN "rsdKumulativ" >= 50000000 THEN 14
    WHEN "rsdKumulativ" >= 20000000 THEN 13
    WHEN "rsdKumulativ" >= 10000000 THEN 12
    WHEN "rsdKumulativ" >= 5000000 THEN 11
    WHEN "rsdKumulativ" >= 2000000 THEN 10
    WHEN "rsdKumulativ" >= 1000000 THEN 9
    WHEN "rsdKumulativ" >= 500000 THEN 8
    WHEN "rsdKumulativ" >= 200000 THEN 7
    WHEN "rsdKumulativ" >= 100000 THEN 6
    WHEN "rsdKumulativ" >= 50000 THEN 5
    WHEN "rsdKumulativ" >= 20000 THEN 4
    WHEN "rsdKumulativ" >= 10000 THEN 3
    WHEN "rsdKumulativ" >= 5000 THEN 2
    ELSE 1
  END
WHERE "rsdKumulativ" > 0;
