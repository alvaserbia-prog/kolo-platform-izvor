-- Pijaca: nova taksonomija od 13 kategorija (slug vrednosti) + tabela
-- pracenih kategorija. Nazivi kategorija idu kroz i18n, u bazi je samo slug.

-- CreateTable: kategorije koje korisnik prati (profil; osnova za fazu 2 — obavestenja)
CREATE TABLE "FollowedCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowedCategory_userId_category_key" ON "FollowedCategory"("userId", "category");

-- CreateIndex
CREATE INDEX "FollowedCategory_category_idx" ON "FollowedCategory"("category");

-- AddForeignKey
ALTER TABLE "FollowedCategory" ADD CONSTRAINT "FollowedCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Data migracija: postojeci oglasi -> nove kategorije ────────────────────
-- Prvo pojedinacni izuzeci po naslovu (samo nad redovima koji su jos u starim
-- kategorijama, da ponovno pokretanje ne dira vec migrirane vrednosti),
-- zatim podrazumevano mapiranje stare kategorije, na kraju catch-all u
-- 'ostalo' — posle ovoga nijedan red ne moze ostati van skupa od 13 slugova.

-- Izuzeci: njiva, basta i zivotinje (Jecam; Stenci Vojvodjanskog pulina)
UPDATE "MarketplaceListing" SET "category" = 'njiva-basta-zivotinje'
WHERE "category" IN ('Hrana', 'Usluge', 'Zanati', 'Elektronika', 'Odeća', 'Ostalo')
  AND ("title" ILIKE '%ječam%' OR "title" ILIKE '%jecam%'
    OR "title" ILIKE '%štenci%' OR "title" ILIKE '%stenci%' OR "title" ILIKE '%pulin%');

-- Izuzeci: za decu (Jednorog; Bicikl (dečiji))
UPDATE "MarketplaceListing" SET "category" = 'za-decu'
WHERE "category" IN ('Hrana', 'Usluge', 'Zanati', 'Elektronika', 'Odeća', 'Ostalo')
  AND ("title" ILIKE '%jednorog%' OR "title" ILIKE '%bicikl%');

-- Izuzeci: znanje i kreativne usluge (Profesionalno fotografisanje; Časovi za osnovce)
UPDATE "MarketplaceListing" SET "category" = 'znanje-i-kreativa'
WHERE "category" IN ('Hrana', 'Usluge', 'Zanati', 'Elektronika', 'Odeća', 'Ostalo')
  AND ("title" ILIKE '%fotografis%' OR "title" ILIKE '%časovi%' OR "title" ILIKE '%casovi%');

-- Izuzeci: smestaj i prostor (Apartman u Vila Olga)
UPDATE "MarketplaceListing" SET "category" = 'smestaj-i-prostor'
WHERE "category" IN ('Hrana', 'Usluge', 'Zanati', 'Elektronika', 'Odeća', 'Ostalo')
  AND ("title" ILIKE '%apartman%' OR "title" ILIKE '%vila olga%');

-- Izuzeci: nega, zdravlje i lepota (Manipulacija fascija; Aloe-Jojoba šampon)
UPDATE "MarketplaceListing" SET "category" = 'nega-zdravlje-lepota'
WHERE "category" IN ('Hrana', 'Usluge', 'Zanati', 'Elektronika', 'Odeća', 'Ostalo')
  AND ("title" ILIKE '%fascij%' OR "title" ILIKE '%šampon%' OR "title" ILIKE '%sampon%' OR "title" ILIKE '%jojoba%');

-- Izuzeci: rucni rad i pokloni (Ivanina 4 oglasa: ruže, ukrasi)
UPDATE "MarketplaceListing" SET "category" = 'rucni-rad-i-pokloni'
WHERE "category" IN ('Hrana', 'Usluge', 'Zanati', 'Elektronika', 'Odeća', 'Ostalo')
  AND ("title" ILIKE '%ručni rad%' OR "title" ILIKE '%rucni rad%'
    OR "title" ILIKE '%ruže%' OR "title" ILIKE '%ruze%' OR "title" ILIKE '%ukras%');

-- Izuzeci: ostalo (Kristali) — eksplicitno, pre podrazumevanog mapiranja
UPDATE "MarketplaceListing" SET "category" = 'ostalo'
WHERE "category" IN ('Hrana', 'Usluge', 'Zanati', 'Elektronika', 'Odeća', 'Ostalo')
  AND "title" ILIKE '%kristal%';

-- Podrazumevano mapiranje po staroj kategoriji
UPDATE "MarketplaceListing" SET "category" = 'hrana-i-pice'        WHERE "category" = 'Hrana';
UPDATE "MarketplaceListing" SET "category" = 'odeca-i-obuca'       WHERE "category" = 'Odeća';
UPDATE "MarketplaceListing" SET "category" = 'pokucstvo-i-tehnika' WHERE "category" = 'Elektronika';
UPDATE "MarketplaceListing" SET "category" = 'rucni-rad-i-pokloni' WHERE "category" = 'Zanati';

-- Catch-all: sve preostalo ('Usluge', 'Ostalo' i eventualne nepoznate vrednosti) -> 'ostalo'
UPDATE "MarketplaceListing" SET "category" = 'ostalo'
WHERE "category" NOT IN (
  'hrana-i-pice', 'njiva-basta-zivotinje', 'odeca-i-obuca', 'pokucstvo-i-tehnika',
  'rucni-rad-i-pokloni', 'za-decu', 'popravke-i-gradjevina', 'prevoz-i-dostava',
  'pomoc-u-kuci', 'nega-zdravlje-lepota', 'znanje-i-kreativa', 'smestaj-i-prostor', 'ostalo'
);
