-- Modul Deca — šestocifreni kod za zatečenu decu (Pravilnik o Modulu Deca, čl. 4b st. 6).
--
-- Kod kojim ulazi DRUGI roditelj živi u redu `RoditeljPoziv`. Nalozi otvoreni PRE
-- ove izmene taj red nemaju, pa im drugi roditelj ne bi mogao da priđe. Ovde se
-- dopunjuju.
--
-- ─── Zašto ZASEBNA migracija, a ne dopuna one koja je tabelu napravila ──────
--
-- 🔴 `prisma migrate deploy` NE PROVERAVA kontrolni zbir već primenjenih migracija.
-- Izmenjen fajl se **tiho preskoči** — bez greške, bez upozorenja, i bez ijednog
-- izvršenog reda. Upravo se to i desilo: dopuna je dopisana u
-- `20260817120100_deca_unapredjeni_model` pošto je ta migracija već bila primenjena
-- na test bazu, pa deploy jeste prošao, ali backfill nije uradio ništa.
--
-- (Zapis u CLAUDE.md je do sada tvrdio da izmena primenjene migracije „obara
-- kontrolni zbir i deploy" — ne obara. Gore je: prolazi kao da je sve u redu.)
--
-- `WHERE NOT EXISTS` čini posao idempotentnim, pa migracija ne pravi štetu ni na
-- bazi na kojoj su redovi već nastali kroz kod.
--
-- `iskoriscenAt` je popunjen, a rokovi su u prošlosti: link se ne šalje i ne sme da
-- radi, a noćni posao koji briše nepreuzete naloge traži `iskoriscenAt IS NULL`, pa
-- ovaj red nikad ne pogađa.
--
-- 🔴 NE koristiti `gen_random_bytes()` — to je pgcrypto, koje na Neonu nije
-- uključeno, pa bi migracija pukla nasred posla. `md5` je ugrađen; dva spojena daju
-- 64 heksadecimalna znaka, a `u."id"` u ulazu jemči jedinstvenost po detetu.
INSERT INTO "RoditeljPoziv" ("id", "deteId", "email", "token", "kod", "tokenDo", "brisanjeDo", "iskoriscenAt", "createdAt")
SELECT gen_random_uuid()::text,
       u."id",
       '',
       md5(u."id" || random()::text) || md5(random()::text || u."id"),
       lpad((100000 + floor(random() * 900000)::int)::text, 6, '0'),
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "User" u
WHERE u."maloletan" = true
  AND u."deaktiviranAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "RoditeljPoziv" p WHERE p."deteId" = u."id");
