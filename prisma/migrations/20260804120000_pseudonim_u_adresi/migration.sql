-- Pseudonim u adresi profila (`/profil/<pseudonim>` umesto internog id-a).
--
-- Uvodi dve stvari:
--   1. `User.pseudonimLower` — ključ za jedinstvenost i pretragu bez obzira na
--      veličinu slova. Do sada su "Marko" i "marko" mogli biti DVA naloga; sa
--      pseudonimom u adresi to je i dvosmisleno i rupa za imitaciju.
--   2. `PseudonimIstorija` — napušteni pseudonimi: stari linkovi ostaju živi, a
--      oslobođeno ime ne može da preuzme neko drugi.
--
-- Prikaz se ne menja: `pseudonim` i dalje čuva velika slova onako kako ih je
-- korisnik upisao.

-- ─── 1. Kolona ────────────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN "pseudonimLower" TEXT;

-- ─── 2. Razrešavanje postojećih sudara ────────────────────────────────────────
-- Ako u bazi već postoje pseudonimi koji se razlikuju samo po veličini slova,
-- jedinstveni indeks ne bi mogao da se napravi i deploy bi pao (migracije se
-- primenjuju u build-u). Zato se sudar razrešava ovde: stariji nalog zadržava
-- svoj pseudonim, mlađi dobija najmanji slobodan numerički sufiks.
-- Očekivano je da ova petlja ne promeni nijedan red.
DO $$
DECLARE
  r      RECORD;
  osnova TEXT;
  novi   TEXT;
  n      INT;
BEGIN
  FOR r IN
    SELECT id, "pseudonim", row_number() OVER (
             PARTITION BY lower("pseudonim") ORDER BY "createdAt", id
           ) AS rn
    FROM "User"
  LOOP
    IF r.rn > 1 THEN
      n := r.rn;
      LOOP
        -- Sufiks ne sme da probije granicu od 30 znakova.
        osnova := left(r."pseudonim", 30 - length(n::text));
        novi   := osnova || n::text;
        EXIT WHEN NOT EXISTS (
          SELECT 1 FROM "User" WHERE lower("pseudonim") = lower(novi)
        );
        n := n + 1;
      END LOOP;
      UPDATE "User" SET "pseudonim" = novi WHERE id = r.id;
      RAISE NOTICE 'Pseudonim "%" preimenovan u "%" (sudar bez obzira na veličinu slova)', r."pseudonim", novi;
    END IF;
  END LOOP;
END $$;

-- ─── 3. Popuna i jedinstvenost ────────────────────────────────────────────────
UPDATE "User" SET "pseudonimLower" = lower("pseudonim");
ALTER TABLE "User" ALTER COLUMN "pseudonimLower" SET NOT NULL;
CREATE UNIQUE INDEX "User_pseudonimLower_key" ON "User"("pseudonimLower");

-- ─── 4. Istorija napuštenih pseudonima ────────────────────────────────────────
CREATE TABLE "PseudonimIstorija" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pseudonim" TEXT NOT NULL,
    "pseudonimLower" TEXT NOT NULL,
    "promenjenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PseudonimIstorija_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PseudonimIstorija_pseudonimLower_key" ON "PseudonimIstorija"("pseudonimLower");
CREATE INDEX "PseudonimIstorija_userId_idx" ON "PseudonimIstorija"("userId");

ALTER TABLE "PseudonimIstorija" ADD CONSTRAINT "PseudonimIstorija_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
