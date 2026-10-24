-- Lokacija = JEDNO naselje iz šifarnika.
--
-- Polje „mesto/lokacija" je do sada bilo slobodan tekst (padajuća lista je samo
-- predlagala naselja), pa su nastali zapisi tipa „Stanišić (Sombor)" — i selo i
-- opština u istom polju. Takav zapis ne pogađa nijedno naselje iz šifarnika, pa
-- mu se ne mogu izračunati koordinate (udaljenost na Pijaci) niti se poklapa sa
-- filterom po mestu.
--
-- Ovde se skida samo dodatak u zagradi na kraju vrednosti („Stanišić (Sombor)" →
-- „Stanišić"): zadržava se uži, precizniji pojam. Ostali zatečeni slobodni unosi
-- se NE diraju — pogrešno pogođeno mesto bilo bi gore od zatečenog teksta, a
-- aplikacija ih razrešava pri čitanju (`razresiNaselje` u `src/lib/naselje.ts`).

UPDATE "User"
SET "location" = NULLIF(btrim(regexp_replace("location", '\s*\([^()]*\)\s*$', '')), '')
WHERE "location" ~ '\([^()]*\)\s*$';

UPDATE "MarketplaceListing"
SET "location" = NULLIF(btrim(regexp_replace("location", '\s*\([^()]*\)\s*$', '')), '')
WHERE "location" ~ '\([^()]*\)\s*$';

UPDATE "Krug"
SET "location" = NULLIF(btrim(regexp_replace("location", '\s*\([^()]*\)\s*$', '')), '')
WHERE "location" ~ '\([^()]*\)\s*$';

UPDATE "KrugOsnivanjeZahtev"
SET "location" = NULLIF(btrim(regexp_replace("location", '\s*\([^()]*\)\s*$', '')), '')
WHERE "location" ~ '\([^()]*\)\s*$';
