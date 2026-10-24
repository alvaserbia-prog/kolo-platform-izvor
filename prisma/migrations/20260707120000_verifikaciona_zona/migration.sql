-- Dokaz stvarnosti 3.9.2: simetrična zabranjena zona (čl. 12) + početni korisnici
-- na fiksnom indeksu 100% (čl. 14).
--
-- verification_zone je KEŠ zabranjene zone — izvor istine ostaje VerifikacionaVeza.
-- Red (userId, forbiddenUserId) znači: userId ne sme da verifikuje forbiddenUserId.
-- Backfill iz postojećih verifikacionih zapisa radi aplikativna rekomputacija
-- (recomputeZones): POST /api/admin/verifikacija/zone-recompute posle deploy-a;
-- tabela se dodatno samostalno dopunjava pri svakoj novoj verifikaciji.
CREATE TABLE "verification_zone" (
    "userId" TEXT NOT NULL,
    "forbiddenUserId" TEXT NOT NULL,

    CONSTRAINT "verification_zone_pkey" PRIMARY KEY ("userId", "forbiddenUserId")
);

-- Composite PK pokriva pretragu po userId; zaseban indeks pokriva obrnuti smer
-- (u čijim se sve zonama korisnik nalazi — druga polovina simetrične provere).
CREATE INDEX "verification_zone_forbiddenUserId_idx" ON "verification_zone"("forbiddenUserId");

ALTER TABLE "verification_zone" ADD CONSTRAINT "verification_zone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_zone" ADD CONSTRAINT "verification_zone_forbiddenUserId_fkey" FOREIGN KEY ("forbiddenUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Čl. 14 (3.9.2): indeks stvarnosti početnih korisnika iznosi 100% od
-- uspostavljanja naloga i ne proizlazi iz lanca jemstva. Postojeći zapisi gde je
-- početni korisnik bio verifikovan se NE brišu (istorijska evidencija) — ubuduće
-- se verifikacija početnog korisnika blokira aplikativno.
UPDATE "User" SET "indeksStvarnosti" = 100 WHERE "jeOsnivac" = true;
