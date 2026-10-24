-- Cirkularna SISTEMSKA obaveštenja (izmene Uslova/Politike, planirani zastoj).
--
-- Šalju se svim korisnicima sa email adresom, mimo `emailObavestenja` opt-out-a,
-- jer proizlaze iz obaveza Fondacije (Uslovi čl. 33/40, Politika čl. 16) — zato
-- je `pravniOsnov` NOT NULL i bez podrazumevane vrednosti.
--
-- `kursorId` čuva poslednji obrađeni User.id (stabilan redosled po id-u), pa je
-- slanje nastavljivo posle isteka funkcije i ne šalje istom korisniku dvaput.

CREATE TYPE "SistemskoStatus" AS ENUM ('NACRT', 'U_SLANJU', 'POSLATO', 'PREKINUTO');

CREATE TABLE "SistemskoObavestenje" (
    "id" TEXT NOT NULL,
    "naslov" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "link" TEXT,
    "pravniOsnov" TEXT NOT NULL,
    "status" "SistemskoStatus" NOT NULL DEFAULT 'NACRT',
    "ukupno" INTEGER NOT NULL DEFAULT 0,
    "poslato" INTEGER NOT NULL DEFAULT 0,
    "neuspesno" INTEGER NOT NULL DEFAULT 0,
    "kursorId" TEXT,
    "kreiraoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pokrenutoAt" TIMESTAMP(3),
    "zavrsenoAt" TIMESTAMP(3),

    CONSTRAINT "SistemskoObavestenje_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SistemskoObavestenje_status_createdAt_idx"
    ON "SistemskoObavestenje"("status", "createdAt" DESC);

ALTER TABLE "SistemskoObavestenje"
    ADD CONSTRAINT "SistemskoObavestenje_kreiraoId_fkey"
    FOREIGN KEY ("kreiraoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
